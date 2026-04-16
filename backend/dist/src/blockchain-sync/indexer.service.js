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
var IndexerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexerService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const prisma_service_1 = require("../prisma/prisma.service");
let IndexerService = IndexerService_1 = class IndexerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IndexerService_1.name);
        this.RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
        this.REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
        this.REGISTRY_ABI = [
            'event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash)',
            'event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount)',
        ];
    }
    async onModuleInit() {
        if (!this.REGISTRY_ADDRESS) {
            this.logger.warn('REGISTRY_ADDRESS not set. Indexer will not start.');
            return;
        }
        try {
            this.registryAddress = this.normalizeAddress(this.REGISTRY_ADDRESS, 'REGISTRY_ADDRESS');
            this.provider = new ethers_1.ethers.JsonRpcProvider(this.RPC_URL);
            this.registryContract = new ethers_1.ethers.Contract(this.registryAddress, this.REGISTRY_ABI, this.provider);
            this.setupEventListeners();
            this.logger.log(`Blockchain Indexer started. Listening at ${this.registryAddress}`);
        }
        catch (error) {
            this.logger.error(`Failed to initialize Indexer: ${error.message}`);
        }
    }
    setupEventListeners() {
        this.registryContract.on('BatchSubmitted', async (batchId, producer, metadataHash, event) => {
            this.logger.log(`Event: BatchSubmitted ID=${batchId} Producer=${producer}`);
            await this.handleBatchSubmitted(batchId.toString(), producer, metadataHash);
        });
        this.registryContract.on('BatchVerified', async (batchId, producer, amount, event) => {
            const txHash = event.log.transactionHash;
            this.logger.log(`Event: BatchVerified ID=${batchId} Tx=${txHash}`);
            await this.handleBatchVerified(batchId.toString(), txHash, Number(amount));
        });
    }
    async handleBatchSubmitted(onChainId, producerWallet, metadataHash) {
        await this.runWithRetry(async () => {
            const batch = await this.prisma.creditBatch.findFirst({
                where: { metadataIPFSHash: metadataHash },
            });
            if (batch) {
                await this.prisma.creditBatch.update({
                    where: { id: batch.id },
                    data: {
                        onChainBatchId: onChainId,
                        status: 'PENDING',
                    },
                });
                this.logger.log(`Synced Batch ${batch.id} with On-Chain ID ${onChainId}`);
            }
            else {
                this.logger.warn(`Received BatchSubmitted for unknown metadata hash: ${metadataHash}`);
            }
        });
    }
    async handleBatchVerified(onChainId, txHash, amount) {
        await this.runWithRetry(async () => {
            const batch = await this.prisma.creditBatch.findUnique({
                where: { onChainBatchId: onChainId },
            });
            if (batch) {
                await this.prisma.creditBatch.update({
                    where: { id: batch.id },
                    data: {
                        status: 'VERIFIED',
                        verifiedAt: new Date(),
                        txHash: txHash,
                        quantity: amount,
                        remainingQuantity: amount,
                    },
                });
                this.logger.log(`Batch ${onChainId} verified and synced.`);
            }
        });
    }
    async runWithRetry(fn, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                await fn();
                return;
            }
            catch (error) {
                if (i === retries - 1)
                    throw error;
                this.logger.warn(`DB sync failed, retrying (${i + 1}/${retries})...`);
                await new Promise((res) => setTimeout(res, 2000));
            }
        }
    }
    normalizeAddress(value, label) {
        const trimmed = value?.trim().replace(/^['"]|['"]$/g, '');
        if (!trimmed || !ethers_1.ethers.isAddress(trimmed)) {
            throw new Error(`Invalid ${label}: ${value}`);
        }
        return ethers_1.ethers.getAddress(trimmed);
    }
};
exports.IndexerService = IndexerService;
exports.IndexerService = IndexerService = IndexerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IndexerService);
//# sourceMappingURL=indexer.service.js.map