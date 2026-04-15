import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getBatchHistory(batchId: string): Promise<{
        batchId: string;
        history: any[];
    }>;
    getCompanyHistory(companyId: string): Promise<{
        companyId: string;
        transactions: any[];
    }>;
}
