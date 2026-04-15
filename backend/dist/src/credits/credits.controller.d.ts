import { CreditsService } from './credits.service';
import { VerifyBatchDto } from './dto/verify-batch.dto';
export declare class CreditsController {
    private readonly creditsService;
    constructor(creditsService: CreditsService);
    submitBatch(req: any, file: Express.Multer.File, metadata: any): Promise<{
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
    verifyBatch(req: any, id: string, verifyDto: VerifyBatchDto): Promise<{
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
