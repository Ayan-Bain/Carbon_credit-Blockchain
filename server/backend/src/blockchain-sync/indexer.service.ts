import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider;
  private registryContract: ethers.Contract;
  private registryAddress: string;

  // These should ideally be in .env
  private readonly RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
  private readonly REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;

  // ABI for the events we need
  private readonly REGISTRY_ABI = [
    'event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash)',
    'event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount)',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!this.REGISTRY_ADDRESS) {
      this.logger.warn('REGISTRY_ADDRESS not set. Indexer will not start.');
      return;
    }

    try {
      this.registryAddress = this.normalizeAddress(this.REGISTRY_ADDRESS, 'REGISTRY_ADDRESS');
      this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
      this.registryContract = new ethers.Contract(
        this.registryAddress,
        this.REGISTRY_ABI,
        this.provider,
      );

      this.setupEventListeners();
      this.logger.log(`Blockchain Indexer started. Listening at ${this.registryAddress}`);
    } catch (error) {
      this.logger.error(`Failed to initialize Indexer: ${error.message}`);
    }
  }

  private setupEventListeners() {
    // 1. Listen for BatchSubmitted
    this.registryContract.on(
      'BatchSubmitted',
      async (batchId: bigint, producer: string, metadataHash: string, event: any) => {
        this.logger.log(`Event: BatchSubmitted ID=${batchId} Producer=${producer}`);
        await this.handleBatchSubmitted(batchId.toString(), producer, metadataHash);
      },
    );

    // 2. Listen for BatchVerified
    this.registryContract.on(
      'BatchVerified',
      async (batchId: bigint, producer: string, amount: bigint, event: any) => {
        const txHash = event.log.transactionHash;
        this.logger.log(`Event: BatchVerified ID=${batchId} Tx=${txHash}`);
        await this.handleBatchVerified(batchId.toString(), txHash, Number(amount));
      },
    );
  }

  private async handleBatchSubmitted(onChainId: string, producerWallet: string, metadataHash: string) {
    await this.runWithRetry(async () => {
      // Find the pending batch by metadata hash (off-chain reference)
      // Note: In a real flow, the producer might have created the record via API first
      const batch = await this.prisma.creditBatch.findFirst({
        where: { metadataIPFSHash: metadataHash },
      });

      if (batch) {
        await this.prisma.creditBatch.update({
          where: { id: batch.id },
          data: {
            onChainBatchId: onChainId,
            status: 'PENDING',
          },
        });
        this.logger.log(`Synced Batch ${batch.id} with On-Chain ID ${onChainId}`);
      } else {
        this.logger.warn(`Received BatchSubmitted for unknown metadata hash: ${metadataHash}`);
      }
    });
  }

  private async handleBatchVerified(onChainId: string, txHash: string, amount: number) {
    await this.runWithRetry(async () => {
      const batch = await this.prisma.creditBatch.findUnique({
        where: { onChainBatchId: onChainId },
      });

      if (batch) {
        await this.prisma.creditBatch.update({
          where: { id: batch.id },
          data: {
            status: 'MINTED',
            verifiedAt: new Date(), // Ideally use timestamp from block
            txHash: txHash,
            quantity: amount,
            remainingQuantity: amount,
          },
        });
        this.logger.log(`Batch ${onChainId} verified and synced.`);
      }
    });
  }

  private async runWithRetry(fn: () => Promise<void>, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await fn();
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        this.logger.warn(`DB sync failed, retrying (${i + 1}/${retries})...`);
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  }

  private normalizeAddress(value: string | undefined, label: string) {
    const trimmed = value?.trim().replace(/^['"]|['"]$/g, '');

    if (!trimmed || !ethers.isAddress(trimmed)) {
      throw new Error(`Invalid ${label}: ${value}`);
    }

    return ethers.getAddress(trimmed);
  }
}
