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
exports.CreditsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ipfs_service_1 = require("../ipfs/ipfs.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let CreditsService = class CreditsService {
    constructor(prisma, ipfsService, blockchain) {
        this.prisma = prisma;
        this.ipfsService = ipfsService;
        this.blockchain = blockchain;
    }
    async submitBatch(producerId, file, metadata) {
        const quantity = parseInt(metadata.quantity, 10);
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            throw new common_1.BadRequestException('quantity must be a positive integer');
        }
        const fileCid = await this.ipfsService.uploadFile(file);
        const metadataJson = {
            ...metadata,
            quantity,
            assetCid: fileCid,
            producerId: producerId,
            timestamp: new Date().toISOString(),
        };
        const metadataCid = await this.ipfsService.uploadJson(metadataJson);
        const batch = await this.prisma.creditBatch.create({
            data: {
                producerId: producerId,
                metadataIPFSHash: metadataCid,
                quantity: quantity,
                remainingQuantity: quantity,
                status: 'PENDING',
            },
        });
        return {
            batch,
            metadataHash: metadataCid,
            assetHash: fileCid,
            nextStep: `Call submitBatch("${metadataCid}") on the CreditRegistry contract with your producer wallet, then confirm via POST /credits/batches/${batch.id}/confirm-onchain`,
        };
    }
    async confirmOnChain(batchId, producerId, onChainBatchId, txHash) {
        const batch = await this.prisma.creditBatch.findUnique({ where: { id: batchId } });
        if (!batch)
            throw new common_1.NotFoundException('Batch not found');
        if (batch.producerId !== producerId)
            throw new common_1.BadRequestException('You do not own this batch');
        if (batch.onChainBatchId)
            throw new common_1.BadRequestException('Batch already confirmed on-chain');
        return this.prisma.creditBatch.update({
            where: { id: batchId },
            data: { onChainBatchId, txHash },
        });
    }
    async getBatch(id) {
        const batch = await this.prisma.creditBatch.findUnique({
            where: { id },
        });
        if (!batch)
            throw new common_1.NotFoundException('Batch not found');
        return batch;
    }
    async getProducerBatches(producerId) {
        return this.prisma.creditBatch.findMany({
            where: { producerId },
        });
    }
    async retireCredits(batchId, amount, buyerId, purpose) {
        if (!amount || !Number.isInteger(amount) || amount <= 0) {
            throw new common_1.BadRequestException('amount must be a positive integer');
        }
        const [batch, buyer, purchased, retired] = await Promise.all([
            this.prisma.creditBatch.findUnique({
                where: { id: batchId },
            }),
            this.prisma.company.findUnique({
                where: { id: buyerId },
            }),
            this.prisma.transaction.aggregate({
                where: {
                    buyerId,
                    status: 'CONFIRMED',
                    listing: {
                        batchId,
                    },
                },
                _sum: {
                    unitsPurchased: true,
                },
            }),
            this.prisma.retirementRecord.aggregate({
                where: {
                    buyerId,
                    batchId,
                },
                _sum: {
                    unitsRetired: true,
                },
            }),
        ]);
        if (!batch) {
            throw new common_1.NotFoundException('Batch not found');
        }
        if (!buyer) {
            throw new common_1.NotFoundException('Buyer not found');
        }
        if (!batch.onChainBatchId) {
            throw new common_1.BadRequestException('Batch has not been confirmed on-chain');
        }
        const purchasedUnits = purchased._sum.unitsPurchased ?? 0;
        const retiredUnits = retired._sum.unitsRetired ?? 0;
        const availableToRetire = purchasedUnits - retiredUnits;
        if (availableToRetire < amount) {
            throw new common_1.BadRequestException('Not enough purchased credits available to retire for this batch');
        }
        const txHash = await this.blockchain.retireCredits(batch.onChainBatchId, buyer.walletAddress, amount);
        const retirement = await this.prisma.retirementRecord.create({
            data: {
                buyerId,
                batchId,
                unitsRetired: amount,
                purpose,
                onChainTxHash: txHash,
            },
        });
        return {
            status: 'Retired successfully',
            batchId,
            amount,
            buyerId,
            purpose: retirement.purpose,
            txHash,
            retirement,
        };
    }
};
exports.CreditsService = CreditsService;
exports.CreditsService = CreditsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ipfs_service_1.IpfsService,
        blockchain_service_1.BlockchainService])
], CreditsService);
//# sourceMappingURL=credits.service.js.map