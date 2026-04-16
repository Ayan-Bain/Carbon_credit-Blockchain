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
      // Producer must now call submitBatch(metadataHash) on the CreditRegistry contract
      // using their own wallet, then call POST /credits/batches/:id/confirm-onchain
      nextStep: `Call submitBatch("${metadataCid}") on the CreditRegistry contract with your producer wallet, then confirm via POST /credits/batches/${batch.id}/confirm-onchain`,
    };
  }

  async confirmOnChain(batchId: string, producerId: string, onChainBatchId: string, txHash: string) {
    const batch = await this.prisma.creditBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.producerId !== producerId) throw new BadRequestException('You do not own this batch');
    if (batch.onChainBatchId) throw new BadRequestException('Batch already confirmed on-chain');

    return this.prisma.creditBatch.update({
      where: { id: batchId },
      data: { onChainBatchId, txHash },
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

    const retirement = await this.prisma.retirementRecord.create({
      data: {
        buyerId,
        batchId,
        unitsRetired: amount,
        purpose,
        onChainTxHash: txHash,
      },
    });

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
