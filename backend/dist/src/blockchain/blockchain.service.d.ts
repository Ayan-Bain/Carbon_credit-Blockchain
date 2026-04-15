import { OnModuleInit } from '@nestjs/common';
export declare class BlockchainService implements OnModuleInit {
    private readonly logger;
    private provider;
    private wallet;
    private registryContract;
    private readonly RPC_URL;
    private readonly REGISTRY_ADDRESS;
    private readonly PRIVATE_KEY;
    private readonly REGISTRY_ABI;
    onModuleInit(): void;
    verifyBatch(onChainBatchId: string, quantity: number): Promise<any>;
}
