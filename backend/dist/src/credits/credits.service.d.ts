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
            status: import(".prisma/client").$Enums.BatchStatus;
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
        message: string;
    }>;
    verifyBatch(batchId: string, regulatorId: string, quantity: number): Promise<{
        id: string;
        onChainBatchId: string | null;
        producerId: string;
        status: import(".prisma/client").$Enums.BatchStatus;
        quantity: number;
        remainingQuantity: number;
        metadataIPFSHash: string;
        submittedAt: Date;
        verifiedAt: Date | null;
        verifiedById: string | null;
        txHash: string | null;
    }>;
}
