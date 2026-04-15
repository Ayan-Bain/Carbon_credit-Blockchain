import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export declare class IndexerService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private provider;
    private registryContract;
    private readonly RPC_URL;
    private readonly REGISTRY_ADDRESS;
    private readonly REGISTRY_ABI;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private setupEventListeners;
    private handleBatchSubmitted;
    private handleBatchVerified;
    private runWithRetry;
}
