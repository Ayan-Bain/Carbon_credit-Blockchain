import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ipfsService: IpfsService,
    private readonly blockchain: BlockchainService,
  ) {}

  async submitBatch(producerId: string, file: Express.Multer.File, metadata: any) {
    // 1. Parse and validate quantity from form data
    const quantity = parseInt(metadata.quantity, 10);
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    // 2. Upload the main document (e.g., certificate image) to IPFS
    const fileCid = await this.ipfsService.uploadFile(file);

    // 3. Wrap the file CID and other metadata into a JSON and upload that to IPFS
    // This JSON CID will be the "metadataHash" stored on-chain
    const metadataJson = {
      ...metadata,
      quantity,
      assetCid: fileCid,
      producerId: producerId,
      timestamp: new Date().toISOString(),
    };

    const metadataCid = await this.ipfsService.uploadJson(metadataJson);

    // 4. Persist DB record — status PENDING, onChainBatchId set after producer submits to contract
    // Note: submitBatch() on the smart contract requires PRODUCER_ROLE on msg.sender.
    // The backend admin key cannot call it. The producer must call it from their own wallet,
    // then confirm the on-chain batch ID via POST /credits/batches/:id/confirm-onchain.
    const batch = await this.prisma.creditBatch.create({
      data: {
        producerId: producerId,
        metadataIPFSHash: metadataCid,
        quantity: quantity,
        remainingQuantity: quantity,
        status: 'PENDING',
      },
    });

    return {
      batch,
      metadataHash: metadataCid,
      assetHash: fileCid,
      nextStep: `Wait for a regulator to approve the credit request (Batch ID: ${batch.id}). After approval, a minter will mint the tokens on-chain.`,
    };
  }

  async mintBatch(batchId: string) {
    const batch = await this.prisma.creditBatch.findUnique({ 
      where: { id: batchId },
      include: { producer: true } 
    });
    
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'APPROVED') {
      throw new BadRequestException('Batch must be in APPROVED status before minting.');
    }
    if (batch.onChainBatchId) {
      throw new BadRequestException('Batch already has an on-chain ID.');
    }

    // Call blockchain to mint
    const { txHash, onChainBatchId } = await this.blockchain.mintBatch(
      batch.producer.walletAddress,
      batch.metadataIPFSHash,
      batch.quantity
    );

    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: 'MINTED',
        onChainBatchId,
        txHash,
      },
    });
  }

  async getBatch(id: string) {
    const batch = await this.prisma.creditBatch.findUnique({
      where: { id },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async getProducerBatches(producerId: string) {
    return this.prisma.creditBatch.findMany({
      where: { producerId },
    });
  }

  async retireCredits(batchId: string, amount: number, buyerId: string, purpose?: string) {
    if (!amount || !Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('amount must be a positive integer');
    }

    const [batch, buyer, purchased, retired] = await Promise.all([
      this.prisma.creditBatch.findUnique({
        where: { id: batchId },
      }),
      this.prisma.company.findUnique({
        where: { id: buyerId },
      }),
      this.prisma.transaction.aggregate({
        where: {
          buyerId,
          status: 'CONFIRMED',
          listing: {
            batchId,
          },
        },
        _sum: {
          unitsPurchased: true,
        },
      }),
      this.prisma.retirementRecord.aggregate({
        where: {
          buyerId,
          batchId,
        },
        _sum: {
          unitsRetired: true,
        },
      }),
    ]);

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (!buyer) {
      throw new NotFoundException('Buyer not found');
    }

    if (!batch.onChainBatchId) {
      throw new BadRequestException('Batch has not been confirmed on-chain');
    }

    const purchasedUnits = purchased._sum.unitsPurchased ?? 0;
    const retiredUnits = retired._sum.unitsRetired ?? 0;
    const availableToRetire = purchasedUnits - retiredUnits;

    if (availableToRetire < amount) {
      throw new BadRequestException('Not enough purchased credits available to retire for this batch');
    }

    const txHash = await this.blockchain.retireCredits(batch.onChainBatchId, buyer.walletAddress, amount);

    const [retirement] = await this.prisma.$transaction([
      this.prisma.retirementRecord.create({
        data: {
          buyerId,
          batchId,
          unitsRetired: amount,
          purpose,
          onChainTxHash: txHash,
        },
      }),
      this.prisma.creditBatch.update({
        where: { id: batchId },
        data: {
          remainingQuantity: {
            decrement: amount,
          },
        },
      }),
    ]);

    return {
      status: 'Retired successfully',
      batchId,
      amount,
      buyerId,
      purpose: retirement.purpose,
      txHash,
      retirement,
    };
  }
}
