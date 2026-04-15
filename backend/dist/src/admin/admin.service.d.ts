import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class AdminService {
    private readonly prisma;
    private readonly blockchain;
    constructor(prisma: PrismaService, blockchain: BlockchainService);
    updateRole(updateRoleDto: UpdateRoleDto): Promise<{
        message: string;
        txHash: any;
    }>;
    getPendingBatches(): Promise<{
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
    }[]>;
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
    rejectBatch(batchId: string, regulatorId: string): Promise<{
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
