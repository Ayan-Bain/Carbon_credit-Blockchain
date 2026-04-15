import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getBatchLifecycle(id: string): Promise<{
        batchId: string;
        history: any[];
    }>;
    getCompanyHistory(id: string): Promise<{
        companyId: string;
        transactions: any[];
    }>;
}
