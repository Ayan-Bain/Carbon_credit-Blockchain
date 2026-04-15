import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private registryContract: ethers.Contract;

  private readonly RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
  private readonly REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
  private readonly PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Regulator/Admin private key

  private readonly REGISTRY_ABI = [
    'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
    'function batches(uint256) view returns (uint256 id, address producer, string metadataHash, uint256 quantity, uint256 submittedAt, bool verified)',
  ];

  onModuleInit() {
    if (!this.REGISTRY_ADDRESS || !this.PRIVATE_KEY) {
      this.logger.warn('Blockchain credentials missing. Verification will not work.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    this.wallet = new ethers.Wallet(this.PRIVATE_KEY, this.provider);
    this.registryContract = new ethers.Contract(
      this.REGISTRY_ADDRESS,
      this.REGISTRY_ABI,
      this.wallet,
    );
  }

  async verifyBatch(onChainBatchId: string, quantity: number) {
    this.logger.log(`Invoking verifyBatch for ID ${onChainBatchId} with quantity ${quantity}`);
    
    // Convert to BigInt for ethers v6
    const tx = await this.registryContract.verifyBatch(
      BigInt(onChainBatchId),
      BigInt(quantity),
    );
    
    this.logger.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    return tx.hash;
  }
}
