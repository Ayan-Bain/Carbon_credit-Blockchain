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
        this.ACCESS_CONTROL_ADDRESS = process.env.ACCESS_CONTROL_ADDRESS;
        this.RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
        this.REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
        this.PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
        this.REGISTRY_ABI = [
            'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
            'function batches(uint256) view returns (uint256 id, address producer, string metadataHash, uint256 quantity, uint256 submittedAt, bool verified)',
        ];
        this.ACCESS_CONTROL_ABI = [
            'function grantRole(bytes32 role, address account) external',
            'function revokeRole(bytes32 role, address account) external',
            'function PRODUCER_ROLE() view returns (bytes32)',
            'function REGULATOR_ROLE() view returns (bytes32)',
            'function BUYER_ROLE() view returns (bytes32)',
        ];
    }
    async onModuleInit() {
        if (!this.REGISTRY_ADDRESS || !this.PRIVATE_KEY || !this.ACCESS_CONTROL_ADDRESS) {
            this.logger.warn('Blockchain credentials missing (Registry, AccessControl, or PK). Some functions will fail.');
            return;
        }
        this.provider = new ethers_1.ethers.JsonRpcProvider(this.RPC_URL);
        this.wallet = new ethers_1.ethers.Wallet(this.PRIVATE_KEY, this.provider);
        this.registryContract = new ethers_1.ethers.Contract(this.REGISTRY_ADDRESS, this.REGISTRY_ABI, this.wallet);
        this.accessControlContract = new ethers_1.ethers.Contract(this.ACCESS_CONTROL_ADDRESS, this.ACCESS_CONTROL_ABI, this.wallet);
    }
    async verifyBatch(onChainBatchId, quantity) {
        this.logger.log(`Invoking verifyBatch for ID ${onChainBatchId} with quantity ${quantity}`);
        const tx = await this.registryContract.verifyBatch(BigInt(onChainBatchId), BigInt(quantity));
        this.logger.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        return tx.hash;
    }
    async setOnChainRole(walletAddress, role, grant) {
        this.logger.log(`${grant ? 'Granting' : 'Revoking'} role ${role} for ${walletAddress}`);
        let roleHash;
        switch (role.toUpperCase()) {
            case 'PRODUCER':
                roleHash = await this.accessControlContract.PRODUCER_ROLE();
                break;
            case 'REGULATOR':
                roleHash = await this.accessControlContract.REGULATOR_ROLE();
                break;
            case 'BUYER':
                roleHash = await this.accessControlContract.BUYER_ROLE();
                break;
            default:
                throw new Error(`Invalid role: ${role}`);
        }
        const tx = grant
            ? await this.accessControlContract.grantRole(roleHash, walletAddress)
            : await this.accessControlContract.revokeRole(roleHash, walletAddress);
        this.logger.log(`Role update tx sent: ${tx.hash}`);
        await tx.wait();
        return tx.hash;
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)()
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map