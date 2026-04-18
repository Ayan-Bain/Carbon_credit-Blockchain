import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ipfsService: IpfsService,
    private readonly blockchainService: BlockchainService,
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
      originalFileName: file.originalname,
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
    if (!(batch as any).mintingPermit) {
      throw new BadRequestException('Batch lacks a valid regulator minting permit.');
    }

    // Call blockchain to mint
    try {
      const { txHash, onChainBatchId } = await this.blockchainService.mintBatch(
        batch.producer.walletAddress,
        batch.metadataIPFSHash,
        batch.quantity,
        (batch as any).mintingPermit
      );

      return this.prisma.creditBatch.update({
        where: { id: batchId },
        data: {
          status: 'VERIFIED', // Use VERIFIED instead of MINTED
          onChainBatchId,
          txHash,
        },
      });
    } catch (err: any) {
      // Intercept Regulator Signature Failure (Indicator of DB Tampering)
      if (err.message?.includes('Audit Failure') || err.message?.includes('Invalid Regulator signature')) {
        const currentHash = this.blockchainService.getMintingHash(
          batch.producer.walletAddress,
          batch.metadataIPFSHash,
          batch.quantity
        );

        throw new BadRequestException({
          message: 'FRAUD ALERT: Regulator signature verification failed on-chain.',
          error: 'SECURITY_MISMATCH',
          regulatorHash: (batch as any).verificationHash,
          unauthorizedHash: currentHash,
          currentQuantity: batch.quantity,
          metadata: batch.metadataIPFSHash
        });
      }
      throw err;
    }
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
      include: {
        listings: true,
        retirements: true,
      },
    });
  }

  async getBatchMetadata(id: string) {
    const batch = await this.getBatch(id);
    return this.ipfsService.fetchJson(batch.metadataIPFSHash);
  }

  async getBatchAsset(id: string) {
    const metadata = await this.getBatchMetadata(id);
    if (!metadata.assetCid) {
      throw new BadRequestException('No asset associated with this batch');
    }
    return this.ipfsService.fetchFile(metadata.assetCid);
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

    const txHash = await this.blockchainService.retireCredits(batch.onChainBatchId, buyer.walletAddress, amount);

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

  async getBuyerPortfolio(buyerId: string) {
    // 1. Get all batches where the buyer has made a purchase
    const batches = await this.prisma.creditBatch.findMany({
      where: {
        listings: {
          some: {
            transactions: {
              some: {
                buyerId,
                status: 'CONFIRMED',
              },
            },
          },
        },
      },
      include: {
        producer: {
          select: {
            name: true,
          },
        },
      },
    });

    // 2. Map and calculate net balance for each batch
    const portfolio = await Promise.all(
      batches.map(async (batch) => {
        const [purchased, retired] = await Promise.all([
          this.prisma.transaction.aggregate({
            where: {
              buyerId,
              status: 'CONFIRMED',
              listing: { batchId: batch.id },
            },
            _sum: { unitsPurchased: true },
          }),
          this.prisma.retirementRecord.aggregate({
            where: {
              buyerId,
              batchId: batch.id,
            },
            _sum: { unitsRetired: true },
          }),
        ]);

        const purchasedUnits = purchased._sum.unitsPurchased ?? 0;
        const retiredUnits = retired._sum.unitsRetired ?? 0;
        const balance = purchasedUnits - retiredUnits;

        return {
          id: batch.id,
          onChainBatchId: batch.onChainBatchId,
          producerName: batch.producer.name,
          quantity: balance,
          metadataIPFSHash: batch.metadataIPFSHash,
          submittedAt: batch.submittedAt,
        };
      }),
    );

    // 3. Filter out zero balances
    return portfolio.filter((item) => item.quantity > 0);
  }
}
