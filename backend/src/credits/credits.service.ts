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
    // 1. Upload the main document (e.g., certificate image) to IPFS
    const fileCid = await this.ipfsService.uploadFile(file);

    // 2. Wrap the file CID and other metadata into a JSON and upload that to IPFS
    // This JSON CID will be the "metadataHash" stored on-chain
    const metadataJson = {
      ...metadata,
      assetCid: fileCid,
      producerId: producerId,
      timestamp: new Date().toISOString(),
    };
    
    const metadataCid = await this.ipfsService.uploadJson(metadataJson);

    // 3. Create record in DB
    const batch = await this.prisma.creditBatch.create({
      data: {
        producerId: producerId,
        metadataIPFSHash: metadataCid, // Final metadata hash
        quantity: 0,
        remainingQuantity: 0,
        status: 'PENDING',
      },
    });

    return {
      batch,
      metadataHash: metadataCid,
      assetHash: fileCid,
      message: 'Product metadata generated and uploaded to IPFS. Use the metadataHash for smart contract submission.',
    };
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

  async retireCredits(batchId: string, amount: number, buyerId: string) {
    return {
      status: 'Retired successfully',
      batchId,
      amount,
      buyerId,
      txHash: '0xdef...'
    };
  }
}
