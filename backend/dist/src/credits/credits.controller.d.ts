import { CreditsService } from './credits.service';
export declare class CreditsController {
    private readonly creditsService;
    constructor(creditsService: CreditsService);
    submitBatch(req: any, file: Express.Multer.File, metadata: any): Promise<{
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
    mintBatch(id: string): Promise<{
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
    getOwnBatches(req: any): Promise<{
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
    getBatchDetails(id: string): Promise<{
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
    retireCredits(req: any, body: {
        batchId: string;
        amount: number;
        purpose?: string;
    }): Promise<{
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
