import { OnModuleInit } from '@nestjs/common';
export declare class BlockchainService implements OnModuleInit {
    private readonly logger;
    private provider;
    private wallet;
    private accessControlContract;
    private registryContract;
    private readonly ACCESS_CONTROL_ADDRESS;
    private readonly RPC_URL;
    private readonly REGISTRY_ADDRESS;
    private readonly PRIVATE_KEY;
    private readonly REGISTRY_ABI;
    private readonly ACCESS_CONTROL_ABI;
    onModuleInit(): Promise<void>;
    verifyBatch(onChainBatchId: string, quantity: number): Promise<any>;
    retireCredits(onChainBatchId: string, walletAddress: string, amount: number): Promise<any>;
    transferCredits(onChainBatchId: string, fromWalletAddress: string, toWalletAddress: string, amount: number): Promise<any>;
    setOnChainRole(walletAddress: string, role: string, grant: boolean): Promise<any>;
    private ensureContractsReady;
}
