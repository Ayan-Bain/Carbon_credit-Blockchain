import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CompanyRole } from '@prisma/client';

@Injectable()
export class CreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ipfsService: IpfsService,
    private readonly blockchain: BlockchainService,
  ) {}

  async submitBatch(producerId: string, file: Express.Multer.File, metadata: any) {
    // 1. Upload to IPFS
    const cid = await this.ipfsService.uploadFile(file);

    // 2. Create record in DB
    const batch = await this.prisma.creditBatch.create({
      data: {
        producerId: producerId,
        metadataIPFSHash: cid,
        quantity: 0,
        remainingQuantity: 0,
        status: 'PENDING',
      },
    });

    return {
      batch,
      ipfsHash: cid,
      message: 'Batch uploaded to IPFS. Please submit to blockchain with this hash.',
    };
  }

  async verifyBatch(batchId: string, regulatorId: string, quantity: number) {
    const batch = await this.prisma.creditBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (!batch.onChainBatchId) {
      throw new BadRequestException('Batch is not yet submitted on-chain');
    }

    if (batch.status === 'VERIFIED') {
      throw new BadRequestException('Batch is already verified');
    }

    // Trigger on-chain verification
    const txHash = await this.blockchain.verifyBatch(batch.onChainBatchId, quantity);

    // Update DB record
    const updatedBatch = await this.prisma.creditBatch.update({
      where: { id: batchId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById: regulatorId,
        txHash: txHash,
        quantity: quantity,
        remainingQuantity: quantity,
      },
    });

    return updatedBatch;
  }
}
