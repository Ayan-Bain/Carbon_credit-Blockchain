import { PrismaService } from '../prisma/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { BlockchainService } from '../blockchain/blockchain.service';
export declare class CreditsService {
    private readonly prisma;
    private readonly ipfsService;
    private readonly blockchain;
    constructor(prisma: PrismaService, ipfsService: IpfsService, blockchain: BlockchainService);
    submitBatch(producerId: string, file: Express.Multer.File, metadata: any): Promise<{
        batch: {
            id: string;
            onChainBatchId: string | null;
            producerId: string;
            status: import("@prisma/client").$Enums.BatchStatus;
            quantity: number;
            remainingQuantity: number;
            metadataIPFSHash: string;
            submittedAt: Date;
            verifiedAt: Date | null;
            verifiedById: string | null;
            txHash: string | null;
        };
        metadataHash: string;
        assetHash: string;
        nextStep: string;
    }>;
    mintBatch(batchId: string): Promise<{
        id: string;
        onChainBatchId: string | null;
        producerId: string;
        status: import("@prisma/client").$Enums.BatchStatus;
        quantity: number;
        remainingQuantity: number;
        metadataIPFSHash: string;
        submittedAt: Date;
        verifiedAt: Date | null;
        verifiedById: string | null;
        txHash: string | null;
    }>;
    getBatch(id: string): Promise<{
        id: string;
        onChainBatchId: string | null;
        producerId: string;
        status: import("@prisma/client").$Enums.BatchStatus;
        quantity: number;
        remainingQuantity: number;
        metadataIPFSHash: string;
        submittedAt: Date;
        verifiedAt: Date | null;
        verifiedById: string | null;
        txHash: string | null;
    }>;
    getProducerBatches(producerId: string): Promise<{
        id: string;
        onChainBatchId: string | null;
        producerId: string;
        status: import("@prisma/client").$Enums.BatchStatus;
        quantity: number;
        remainingQuantity: number;
        metadataIPFSHash: string;
        submittedAt: Date;
        verifiedAt: Date | null;
        verifiedById: string | null;
        txHash: string | null;
    }[]>;
    retireCredits(batchId: string, amount: number, buyerId: string, purpose?: string): Promise<{
        status: string;
        batchId: string;
        amount: number;
        buyerId: string;
        purpose: string;
        txHash: any;
        retirement: {
            id: string;
            buyerId: string;
            batchId: string;
            unitsRetired: number;
            purpose: string | null;
            retiredAt: Date;
            onChainTxHash: string;
        };
    }>;
}
