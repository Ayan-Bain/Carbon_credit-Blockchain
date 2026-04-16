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
exports.MarketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let MarketService = class MarketService {
    constructor(prisma, blockchain) {
        this.prisma = prisma;
        this.blockchain = blockchain;
    }
    async createListing(batchId, price, amount, producerId) {
        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            throw new common_1.BadRequestException('price must be a positive number');
        }
        if (!amount || !Number.isInteger(amount) || amount <= 0) {
            throw new common_1.BadRequestException('amount must be a positive integer');
        }
        const batch = await this.prisma.creditBatch.findUnique({
            where: { id: batchId },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found');
        }
        if (batch.producerId !== producerId) {
            throw new common_1.BadRequestException('You do not own this batch');
        }
        if (batch.status !== client_1.BatchStatus.VERIFIED && batch.status !== client_1.BatchStatus.LISTED) {
            throw new common_1.BadRequestException('Only verified batches can be listed');
        }
        if (batch.remainingQuantity < amount) {
            throw new common_1.BadRequestException('Not enough available credits in this batch');
        }
        const listing = await this.prisma.$transaction(async (tx) => {
            const createdListing = await tx.creditListing.create({
                data: {
                    batchId,
                    sellerId: producerId,
                    pricePerUnit: numericPrice,
                    availableUnits: amount,
                },
                include: {
                    batch: true,
                    seller: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                        },
                    },
                },
            });
            await tx.creditBatch.update({
                where: { id: batchId },
                data: {
                    remainingQuantity: {
                        decrement: amount,
                    },
                    status: client_1.BatchStatus.LISTED,
                },
            });
            return createdListing;
        });
        return this.serializeListing(listing);
    }
    async getListings() {
        const listings = await this.prisma.creditListing.findMany({
            where: {
                availableUnits: {
                    gt: 0,
                },
            },
            include: {
                batch: true,
                seller: {
                    select: {
                        id: true,
                        name: true,
                        walletAddress: true,
                    },
                },
            },
            orderBy: {
                listedAt: 'desc',
            },
        });
        return listings.map((listing) => this.serializeListing(listing));
    }
    async buyListing(listingId, amount, buyerId) {
        if (!amount || !Number.isInteger(amount) || amount <= 0) {
            throw new common_1.BadRequestException('amount must be a positive integer');
        }
        const listing = await this.prisma.creditListing.findUnique({
            where: { id: listingId },
            include: {
                batch: true,
                seller: true,
            },
        });
        if (!listing) {
            throw new common_1.NotFoundException('Listing not found');
        }
        if (listing.availableUnits < amount) {
            throw new common_1.BadRequestException('Not enough credits available in this listing');
        }
        const buyer = await this.prisma.company.findUnique({
            where: { id: buyerId },
        });
        if (!buyer) {
            throw new common_1.NotFoundException('Buyer not found');
        }
        if (!listing.batch.onChainBatchId) {
            throw new common_1.BadRequestException('Batch has not been confirmed on-chain');
        }
        const txHash = await this.blockchain.transferCredits(listing.batch.onChainBatchId, listing.seller.walletAddress, buyer.walletAddress, amount);
        const updated = await this.prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    listingId,
                    buyerId,
                    unitsPurchased: amount,
                    totalPrice: Number(listing.pricePerUnit) * amount,
                    onChainTxHash: txHash,
                    status: 'CONFIRMED',
                },
            });
            const updatedListing = await tx.creditListing.update({
                where: { id: listingId },
                data: {
                    availableUnits: {
                        decrement: amount,
                    },
                },
            });
            if (updatedListing.availableUnits === 0 && listing.batch.remainingQuantity === 0) {
                await tx.creditBatch.update({
                    where: { id: listing.batchId },
                    data: {
                        status: client_1.BatchStatus.SOLD_OUT,
                    },
                });
            }
            return transaction;
        });
        return {
            status: 'Purchase successful',
            transactionId: updated.id,
            listingId,
            amount,
            txHash,
        };
    }
    serializeListing(listing) {
        return {
            ...listing,
            pricePerUnit: Number(listing.pricePerUnit),
        };
    }
};
exports.MarketService = MarketService;
exports.MarketService = MarketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], MarketService);
//# sourceMappingURL=market.service.js.map