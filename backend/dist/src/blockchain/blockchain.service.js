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
        this.PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
        this.REGISTRY_ABI = [
            'function submitBatch(string memory _metadataHash) external returns (uint256)',
            'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
            'function transferCredits(uint256 _batchId, address _from, address _to, uint256 _amount) external',
            'function retireCredits(uint256 _batchId, address _account, uint256 _amount) external',
            'function batches(uint256) view returns (uint256 id, address producer, string metadataHash, uint256 quantity, uint256 submittedAt, bool verified)',
            'event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash)',
            'event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount)',
            'event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount)',
            'event CreditsRetired(uint256 indexed batchId, address indexed account, uint256 amount)',
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
        if (!process.env.REGISTRY_ADDRESS || !this.PRIVATE_KEY || !process.env.ACCESS_CONTROL_ADDRESS) {
            this.logger.warn('Blockchain credentials missing (Registry, AccessControl, or PK). Some functions will fail.');
            return;
        }
        this.registryAddress = this.normalizeAddress(process.env.REGISTRY_ADDRESS, 'REGISTRY_ADDRESS');
        this.accessControlAddress = this.normalizeAddress(process.env.ACCESS_CONTROL_ADDRESS, 'ACCESS_CONTROL_ADDRESS');
        this.provider = new ethers_1.ethers.JsonRpcProvider(this.RPC_URL);
        this.wallet = new ethers_1.ethers.Wallet(this.PRIVATE_KEY, this.provider);
        this.registryContract = new ethers_1.ethers.Contract(this.registryAddress, this.REGISTRY_ABI, this.wallet);
        this.accessControlContract = new ethers_1.ethers.Contract(this.accessControlAddress, this.ACCESS_CONTROL_ABI, this.wallet);
    }
    async verifyBatch(onChainBatchId, quantity) {
        this.ensureContractsReady();
        this.logger.log(`Invoking verifyBatch for ID ${onChainBatchId} with quantity ${quantity}`);
        if (!onChainBatchId) {
            throw new Error(`verifyBatch called with invalid onChainBatchId: ${onChainBatchId}`);
        }
        if (!quantity || quantity <= 0) {
            throw new Error(`verifyBatch called with invalid quantity: ${quantity}`);
        }
        const tx = await this.registryContract.verifyBatch(BigInt(onChainBatchId), BigInt(quantity));
        this.logger.log(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        return tx.hash;
    }
    async retireCredits(onChainBatchId, walletAddress, amount) {
        this.ensureContractsReady();
        const normalizedWalletAddress = this.normalizeAddress(walletAddress, 'buyer wallet');
        this.logger.log(`Invoking retireCredits for ID ${onChainBatchId}, wallet ${normalizedWalletAddress}, amount ${amount}`);
        if (!onChainBatchId) {
            throw new Error(`retireCredits called with invalid onChainBatchId: ${onChainBatchId}`);
        }
        if (!amount || amount <= 0) {
            throw new Error(`retireCredits called with invalid amount: ${amount}`);
        }
        const tx = await this.registryContract.retireCredits(BigInt(onChainBatchId), normalizedWalletAddress, BigInt(amount));
        this.logger.log(`Retirement transaction sent: ${tx.hash}`);
        await tx.wait();
        return tx.hash;
    }
    async transferCredits(onChainBatchId, fromWalletAddress, toWalletAddress, amount) {
        this.ensureContractsReady();
        const normalizedFromAddress = this.normalizeAddress(fromWalletAddress, 'seller wallet');
        const normalizedToAddress = this.normalizeAddress(toWalletAddress, 'buyer wallet');
        this.logger.log(`Invoking transferCredits for ID ${onChainBatchId}, from ${normalizedFromAddress}, to ${normalizedToAddress}, amount ${amount}`);
        if (!onChainBatchId) {
            throw new Error(`transferCredits called with invalid onChainBatchId: ${onChainBatchId}`);
        }
        if (!amount || amount <= 0) {
            throw new Error(`transferCredits called with invalid amount: ${amount}`);
        }
        const tx = await this.registryContract.transferCredits(BigInt(onChainBatchId), normalizedFromAddress, normalizedToAddress, BigInt(amount));
        this.logger.log(`Transfer transaction sent: ${tx.hash}`);
        await tx.wait();
        return tx.hash;
    }
    async setOnChainRole(walletAddress, role, grant) {
        this.ensureContractsReady();
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
    ensureContractsReady() {
        if (!this.registryContract || !this.accessControlContract) {
            throw new Error('Blockchain contracts are not initialized. Check REGISTRY_ADDRESS, ACCESS_CONTROL_ADDRESS, and ADMIN_PRIVATE_KEY.');
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
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = BlockchainService_1 = __decorate([
    (0, common_1.Injectable)()
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map