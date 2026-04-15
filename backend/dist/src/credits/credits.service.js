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
        const fileCid = await this.ipfsService.uploadFile(file);
        const metadataJson = {
            ...metadata,
            assetCid: fileCid,
            producerId: producerId,
            timestamp: new Date().toISOString(),
        };
        const metadataCid = await this.ipfsService.uploadJson(metadataJson);
        const batch = await this.prisma.creditBatch.create({
            data: {
                producerId: producerId,
                metadataIPFSHash: metadataCid,
                quantity: 0,
                remainingQuantity: 0,
                status: 'PENDING',
            },
        });
        return {
            batch,
            metadataHash: metadataCid,
            assetHash: fileCid,
            message: 'Product metadata generated and uploaded to IPFS. Use the metadataHash for smart contract submission.',
        };
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
    async retireCredits(batchId, amount, buyerId) {
        return {
            status: 'Retired successfully',
            batchId,
            amount,
            buyerId,
            txHash: '0xdef...'
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