"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBatchHistory(batchId) {
        const batch = await this.prisma.creditBatch.findUnique({
            where: { id: batchId },
            include: {
                producer: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                    },
                },
                verifiedBy: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                    },
                },
                listings: {
                    include: {
                        seller: {
                            select: {
                                id: true,
                                name: true,
                                walletAddress: true,
                            },
                        },
                        transactions: {
                            include: {
                                buyer: {
                                    select: {
                                        id: true,
                                        name: true,
                                        walletAddress: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        listedAt: 'asc',
                    },
                },
                retirements: {
                    include: {
                        buyer: {
                            select: {
                                id: true,
                                name: true,
                                walletAddress: true,
                            },
                        },
                    },
                    orderBy: {
                        retiredAt: 'asc',
                    },
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found');
        }
        const history = [
            {
                type: 'BATCH_SUBMITTED',
                at: batch.submittedAt,
                details: {
                    status: batch.status,
                    quantity: batch.quantity,
                    remainingQuantity: batch.remainingQuantity,
                    metadataIPFSHash: batch.metadataIPFSHash,
                    onChainBatchId: batch.onChainBatchId,
                    producer: batch.producer,
                },
            },
            ...(batch.verifiedAt
                ? [
                    {
                        type: batch.status === 'REJECTED' ? 'BATCH_REJECTED' : 'BATCH_VERIFIED',
                        at: batch.verifiedAt,
                        details: {
                            status: batch.status,
                            verifier: batch.verifiedBy,
                            txHash: batch.txHash,
                        },
                    },
                ]
                : []),
            ...batch.listings.map((listing) => ({
                type: 'LISTING_CREATED',
                at: listing.listedAt,
                details: {
                    listingId: listing.id,
                    seller: listing.seller,
                    pricePerUnit: Number(listing.pricePerUnit),
                    availableUnits: listing.availableUnits,
                },
            })),
            ...batch.listings.flatMap((listing) => listing.transactions.map((transaction) => ({
                type: 'LISTING_PURCHASED',
                at: transaction.createdAt,
                details: {
                    listingId: listing.id,
                    transactionId: transaction.id,
                    buyer: transaction.buyer,
                    unitsPurchased: transaction.unitsPurchased,
                    totalPrice: Number(transaction.totalPrice),
                    status: transaction.status,
                    onChainTxHash: transaction.onChainTxHash,
                },
            }))),
            ...batch.retirements.map((retirement) => ({
                type: 'CREDITS_RETIRED',
                at: retirement.retiredAt,
                details: {
                    retirementId: retirement.id,
                    buyer: retirement.buyer,
                    unitsRetired: retirement.unitsRetired,
                    purpose: retirement.purpose,
                    onChainTxHash: retirement.onChainTxHash,
                },
            })),
        ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
        return {
            batchId,
            batch: {
                id: batch.id,
                onChainBatchId: batch.onChainBatchId,
                status: batch.status,
                quantity: batch.quantity,
                remainingQuantity: batch.remainingQuantity,
                metadataIPFSHash: batch.metadataIPFSHash,
                submittedAt: batch.submittedAt,
                verifiedAt: batch.verifiedAt,
                txHash: batch.txHash,
                producer: batch.producer,
                verifiedBy: batch.verifiedBy,
            },
            history,
        };
    }
    async getCompanyHistory(companyId) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
            select: {
                id: true,
                name: true,
                walletAddress: true,
                role: true,
                kycVerified: true,
                createdAt: true,
            },
        });
        if (!company) {
            throw new common_1.NotFoundException('Company not found');
        }
        const [producedBatches, verifiedBatches, listings, purchases, retirements] = await Promise.all([
            this.prisma.creditBatch.findMany({
                where: { producerId: companyId },
                orderBy: { submittedAt: 'asc' },
            }),
            this.prisma.creditBatch.findMany({
                where: { verifiedById: companyId },
                orderBy: { verifiedAt: 'asc' },
            }),
            this.prisma.creditListing.findMany({
                where: { sellerId: companyId },
                include: {
                    batch: {
                        select: {
                            id: true,
                            onChainBatchId: true,
                        },
                    },
                },
                orderBy: { listedAt: 'asc' },
            }),
            this.prisma.transaction.findMany({
                where: { buyerId: companyId },
                include: {
                    listing: {
                        include: {
                            batch: {
                                select: {
                                    id: true,
                                    onChainBatchId: true,
                                },
                            },
                            seller: {
                                select: {
                                    id: true,
                                    name: true,
                                    walletAddress: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.retirementRecord.findMany({
                where: { buyerId: companyId },
                include: {
                    batch: {
                        select: {
                            id: true,
                            onChainBatchId: true,
                        },
                    },
                },
                orderBy: { retiredAt: 'asc' },
            }),
        ]);
        const history = [
            {
                type: 'COMPANY_CREATED',
                at: company.createdAt,
                details: {
                    role: company.role,
                    kycVerified: company.kycVerified,
                },
            },
            ...producedBatches.map((batch) => ({
                type: 'BATCH_SUBMITTED',
                at: batch.submittedAt,
                details: {
                    batchId: batch.id,
                    onChainBatchId: batch.onChainBatchId,
                    status: batch.status,
                    quantity: batch.quantity,
                    remainingQuantity: batch.remainingQuantity,
                },
            })),
            ...verifiedBatches
                .filter((batch) => batch.verifiedAt)
                .map((batch) => ({
                type: batch.status === 'REJECTED' ? 'BATCH_REJECTED' : 'BATCH_VERIFIED',
                at: batch.verifiedAt,
                details: {
                    batchId: batch.id,
                    onChainBatchId: batch.onChainBatchId,
                    status: batch.status,
                    quantity: batch.quantity,
                    remainingQuantity: batch.remainingQuantity,
                    txHash: batch.txHash,
                },
            })),
            ...listings.map((listing) => ({
                type: 'LISTING_CREATED',
                at: listing.listedAt,
                details: {
                    listingId: listing.id,
                    batchId: listing.batchId,
                    onChainBatchId: listing.batch.onChainBatchId,
                    pricePerUnit: Number(listing.pricePerUnit),
                    availableUnits: listing.availableUnits,
                },
            })),
            ...purchases.map((transaction) => ({
                type: 'CREDITS_PURCHASED',
                at: transaction.createdAt,
                details: {
                    transactionId: transaction.id,
                    listingId: transaction.listingId,
                    batchId: transaction.listing.batchId,
                    onChainBatchId: transaction.listing.batch.onChainBatchId,
                    seller: transaction.listing.seller,
                    unitsPurchased: transaction.unitsPurchased,
                    totalPrice: Number(transaction.totalPrice),
                    status: transaction.status,
                    onChainTxHash: transaction.onChainTxHash,
                },
            })),
            ...retirements.map((retirement) => ({
                type: 'CREDITS_RETIRED',
                at: retirement.retiredAt,
                details: {
                    retirementId: retirement.id,
                    batchId: retirement.batchId,
                    onChainBatchId: retirement.batch.onChainBatchId,
                    unitsRetired: retirement.unitsRetired,
                    purpose: retirement.purpose,
                    onChainTxHash: retirement.onChainTxHash,
                },
            })),
        ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
        return {
            companyId,
            company,
            history,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map