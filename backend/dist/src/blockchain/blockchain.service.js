"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BlockchainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
let BlockchainService = BlockchainService_1 = class BlockchainService {
    constructor() {
        this.logger = new common_1.Logger(BlockchainService_1.name);
        this.RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
        this.REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
        this.PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
        this.REGISTRY_ABI = [
            'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
            'function batches(uint256) view returns (uint256 id, address producer, string metadataHash, uint256 quantity, uint256 submittedAt, bool verified)',
        ];
    }
    onModuleInit() {
        if (!this.REGISTRY_ADDRESS || !this.PRIVATE_KEY) {
            this.logger.warn('Blockchain credentials missing. Verification will not work.');
            return;
        }
        this.provider = new ethers_1.ethers.JsonRpcProvider(this.RPC_URL);
        this.wallet = new ethers_1.ethers.Wallet(this.PRIVATE_KEY, this.provider);
        this.registryContract = new ethers_1.ethers.Contract(this.REGISTRY_ADDRESS, this.REGISTRY_ABI, this.wallet);
    }
    async verifyBatch(onChainBatchId, quantity) {
        this.logger.log(`Invoking verifyBatch for ID ${onChainBatchId} with quantity ${quantity}`);
        const tx = await this.registryContract.verifyBatch(BigInt(onChainBatchId), BigInt(quantity));
        this.logger.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        return tx.hash;
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)()
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map