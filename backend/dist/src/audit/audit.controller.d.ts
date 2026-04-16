import { AuditService } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getBatchLifecycle(id: string): Promise<{
        batchId: string;
        batch: {
            id: string;
            onChainBatchId: string;
            status: import("@prisma/client").$Enums.BatchStatus;
            quantity: number;
            remainingQuantity: number;
            metadataIPFSHash: string;
            submittedAt: Date;
            verifiedAt: Date;
            txHash: string;
            producer: {
                id: string;
                name: string;
                walletAddress: string;
            };
            verifiedBy: {
                id: string;
                name: string;
                walletAddress: string;
            };
        };
        history: ({
            type: string;
            at: Date;
            details: {
                listingId: string;
                seller: {
                    id: string;
                    name: string;
                    walletAddress: string;
                };
                pricePerUnit: number;
                availableUnits: number;
            };
        } | {
            type: string;
            at: Date;
            details: {
                listingId: string;
                transactionId: string;
                buyer: {
                    id: string;
                    name: string;
                    walletAddress: string;
                };
                unitsPurchased: number;
                totalPrice: number;
                status: import("@prisma/client").$Enums.TransactionStatus;
                onChainTxHash: string;
            };
        } | {
            type: string;
            at: Date;
            details: {
                retirementId: string;
                buyer: {
                    id: string;
                    name: string;
                    walletAddress: string;
                };
                unitsRetired: number;
                purpose: string;
                onChainTxHash: string;
            };
        } | {
            type: string;
            at: Date;
            details: {
                status: import("@prisma/client").$Enums.BatchStatus;
                quantity: number;
                remainingQuantity: number;
                metadataIPFSHash: string;
                onChainBatchId: string;
                producer: {
                    id: string;
                    name: string;
                    walletAddress: string;
                };
                verifier?: undefined;
                txHash?: undefined;
            };
        } | {
            type: string;
            at: Date;
            details: {
                status: import("@prisma/client").$Enums.BatchStatus;
                verifier: {
                    id: string;
                    name: string;
                    walletAddress: string;
                };
                txHash: string;
                quantity?: undefined;
                remainingQuantity?: undefined;
                metadataIPFSHash?: undefined;
                onChainBatchId?: undefined;
                producer?: undefined;
            };
        })[];
    }>;
    getCompanyHistory(id: string): Promise<{
        companyId: string;
        company: {
            id: string;
            name: string;
            walletAddress: string;
            role: import("@prisma/client").$Enums.CompanyRole;
            kycVerified: boolean;
            createdAt: Date;
        };
        history: ({
            type: string;
            at: Date;
            details: {
                batchId: string;
                onChainBatchId: string;
                status: import("@prisma/client").$Enums.BatchStatus;
                quantity: number;
                remainingQuantity: number;
            };
        } | {
            type: string;
            at: Date;
            details: {
                listingId: string;
                batchId: string;
                onChainBatchId: string;
                pricePerUnit: number;
                availableUnits: number;
            };
        } | {
            type: string;
            at: Date;
            details: {
                transactionId: string;
                listingId: string;
                batchId: string;
                onChainBatchId: string;
                seller: {
                    id: string;
                    name: string;
                    walletAddress: string;
                };
                unitsPurchased: number;
                totalPrice: number;
                status: import("@prisma/client").$Enums.TransactionStatus;
                onChainTxHash: string;
            };
        } | {
            type: string;
            at: Date;
            details: {
                retirementId: string;
                batchId: string;
                onChainBatchId: string;
                unitsRetired: number;
                purpose: string;
                onChainTxHash: string;
            };
        } | {
            type: string;
            at: Date;
            details: {
                role: import("@prisma/client").$Enums.CompanyRole;
                kycVerified: boolean;
            };
        })[];
    }>;
}
