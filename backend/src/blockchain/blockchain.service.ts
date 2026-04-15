import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private accessControlContract: ethers.Contract;
  private registryContract: ethers.Contract;

  private readonly ACCESS_CONTROL_ADDRESS = process.env.ACCESS_CONTROL_ADDRESS;
  private readonly RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
  private readonly REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
  private readonly PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Regulator/Admin private key

  private readonly REGISTRY_ABI = [
    'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
    'function batches(uint256) view returns (uint256 id, address producer, string metadataHash, uint256 quantity, uint256 submittedAt, bool verified)',
  ];

  private readonly ACCESS_CONTROL_ABI = [
    'function grantRole(bytes32 role, address account) external',
    'function revokeRole(bytes32 role, address account) external',
    'function PRODUCER_ROLE() view returns (bytes32)',
    'function REGULATOR_ROLE() view returns (bytes32)',
    'function BUYER_ROLE() view returns (bytes32)',
  ];

  async onModuleInit() {
    if (!this.REGISTRY_ADDRESS || !this.PRIVATE_KEY || !this.ACCESS_CONTROL_ADDRESS) {
      this.logger.warn('Blockchain credentials missing (Registry, AccessControl, or PK). Some functions will fail.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    this.wallet = new ethers.Wallet(this.PRIVATE_KEY, this.provider);
    
    this.registryContract = new ethers.Contract(
      this.REGISTRY_ADDRESS,
      this.REGISTRY_ABI,
      this.wallet,
    );

    this.accessControlContract = new ethers.Contract(
      this.ACCESS_CONTROL_ADDRESS,
      this.ACCESS_CONTROL_ABI,
      this.wallet,
    );
  }

  async verifyBatch(onChainBatchId: string, quantity: number) {
    this.logger.log(`Invoking verifyBatch for ID ${onChainBatchId} with quantity ${quantity}`);
    const tx = await this.registryContract.verifyBatch(
      BigInt(onChainBatchId),
      BigInt(quantity),
    );
    this.logger.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    return tx.hash;
  }

  async setOnChainRole(walletAddress: string, role: string, grant: boolean) {
    this.logger.log(`${grant ? 'Granting' : 'Revoking'} role ${role} for ${walletAddress}`);
    
    let roleHash: string;
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
}
