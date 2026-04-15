import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
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
    verifyBatch(req: any, id: string, body: {
        quantity: number;
    }): Promise<{
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
    rejectBatch(req: any, id: string): Promise<{
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
