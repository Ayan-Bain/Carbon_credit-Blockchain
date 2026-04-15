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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let AdminService = class AdminService {
    constructor(prisma, blockchain) {
        this.prisma = prisma;
        this.blockchain = blockchain;
    }
    async updateRole(updateRoleDto) {
        const { walletAddress, role, grant } = updateRoleDto;
        const company = await this.prisma.company.findUnique({
            where: { walletAddress },
        });
        if (!company) {
            throw new common_1.NotFoundException(`Company with wallet ${walletAddress} not found`);
        }
        await this.prisma.company.update({
            where: { walletAddress },
            data: { role: grant ? role : 'BUYER' },
        });
        const txHash = await this.blockchain.setOnChainRole(walletAddress, role, grant);
        return {
            message: `Role ${role} ${grant ? 'granted to' : 'revoked from'} ${walletAddress}`,
            txHash,
        };
    }
    async getPendingBatches() {
        return this.prisma.creditBatch.findMany({
            where: { status: 'PENDING' },
        });
    }
    async verifyBatch(batchId, regulatorId, quantity) {
        const batch = await this.prisma.creditBatch.findUnique({
            where: { id: batchId },
        });
        if (!batch)
            throw new common_1.NotFoundException('Batch not found');
        const txHash = await this.blockchain.verifyBatch(batch.onChainBatchId, quantity);
        return this.prisma.creditBatch.update({
            where: { id: batchId },
            data: {
                status: 'VERIFIED',
                verifiedAt: new Date(),
                verifiedById: regulatorId,
                txHash: txHash,
                quantity: quantity,
                remainingQuantity: quantity,
            },
        });
    }
    async rejectBatch(batchId, regulatorId) {
        return this.prisma.creditBatch.update({
            where: { id: batchId },
            data: {
                status: 'REJECTED',
                verifiedAt: new Date(),
                verifiedById: regulatorId,
            },
        });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        blockchain_service_1.BlockchainService])
], AdminService);
//# sourceMappingURL=admin.service.js.map