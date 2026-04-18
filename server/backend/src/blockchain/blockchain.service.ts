import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private accessControlContract: ethers.Contract;
  private registryContract: ethers.Contract;
  private accessControlAddress: string;
  private readonly RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
  private registryAddress: string;
  private readonly PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; // Regulator/Admin private key

  private readonly REGISTRY_ABI = [
    'function recordApproval(address _producer, uint256 _quantity, string calldata _metadataHash) external returns (uint256)',
    'function invalidateBatch(uint256 _batchId) external',
    'function executeMinting(uint256 _batchId, uint256 _providedQuantity, string calldata _providedMetadataHash) external',
    'function transferCredits(uint256 _batchId, address _from, address _to, uint256 _amount, uint256 _providedQuantity, string calldata _providedMetadataHash) external',
    'function retireCredits(uint256 _batchId, address _account, uint256 _amount, uint256 _providedQuantity, string calldata _providedMetadataHash) external',
    'function batches(uint256) view returns (uint256 id, address producer, bytes32 stateDigest, uint256 quantity, uint256 submittedAt, bool verified, bool isInvalid)',
    'function batchRetiredUnits(uint256) view returns (uint256)',
    'function totalRetiredUnits() view returns (uint256)',
    'event BatchApproved(uint256 indexed batchId, uint256 quantity, string metadataHash)',
    'event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount)',
    'event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount)',
    'event CreditsRetired(uint256 indexed batchId, address indexed account, uint256 amount)',
    'event TamperingDetected(uint256 indexed batchId, bytes32 expectedDigest, bytes32 actualDigest)',
  ];


  private readonly ACCESS_CONTROL_ABI = [
    'function grantRole(bytes32 role, address account) external',
    'function revokeRole(bytes32 role, address account) external',
    'function PRODUCER_ROLE() view returns (bytes32)',
    'function REGULATOR_ROLE() view returns (bytes32)',
    'function BUYER_ROLE() view returns (bytes32)',
    'function MINTER_ROLE() view returns (bytes32)',
  ];

  async onModuleInit() {
    if (!process.env.REGISTRY_ADDRESS || !this.PRIVATE_KEY || !process.env.ACCESS_CONTROL_ADDRESS) {
      this.logger.warn('Blockchain credentials missing (Registry, AccessControl, or PK). Some functions will fail.');
      return;
    }

    this.registryAddress = this.normalizeAddress(process.env.REGISTRY_ADDRESS, 'REGISTRY_ADDRESS');
    this.accessControlAddress = this.normalizeAddress(process.env.ACCESS_CONTROL_ADDRESS, 'ACCESS_CONTROL_ADDRESS');
    this.logger.log(`BlockchainService initialized with Registry: ${this.registryAddress}, AccessControl: ${this.accessControlAddress}`);

    this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
    this.wallet = new ethers.Wallet(this.PRIVATE_KEY, this.provider);
    
    this.registryContract = new ethers.Contract(
      this.registryAddress,
      this.REGISTRY_ABI,
      this.wallet,
    );

    this.accessControlContract = new ethers.Contract(
      this.accessControlAddress,
      this.ACCESS_CONTROL_ABI,
      this.wallet,
    );
  }

  async recordApproval(producerWallet: string, metadataHash: string, quantity: number) {
    this.ensureContractsReady();
    this.logger.log(`Invoking recordApproval for producer ${producerWallet}, hash ${metadataHash}, quantity ${quantity}`);

    const normalizedProducer = this.normalizeAddress(producerWallet, 'producer wallet');
    
    const tx = await this.registryContract.recordApproval(
      normalizedProducer,
      BigInt(quantity),
      metadataHash,
    );
    this.logger.log(`Approval record transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    
    // Parse logs to find BatchApproved event and get the ID
    const event = receipt.logs.find((l: any) => {
      try {
        const parsed = this.registryContract.interface.parseLog(l);
        return parsed?.name === 'BatchApproved';
      } catch (e) {
        return false;
      }
    });

    if (event) {
      const parsed = this.registryContract.interface.parseLog(event);
      return {
        txHash: tx.hash,
        onChainBatchId: parsed?.args[0].toString(),
      };
    }

    return { txHash: tx.hash };
  }

  async executeMinting(onChainBatchId: string, quantity: number, metadataHash: string) {
    this.ensureContractsReady();
    this.logger.log(`Invoking executeMinting for ID ${onChainBatchId}, quantity ${quantity}`);

    if (!onChainBatchId) {
      throw new Error(`executeMinting called with invalid onChainBatchId: ${onChainBatchId}`);
    }

    const tx = await this.registryContract.executeMinting(
      BigInt(onChainBatchId),
      BigInt(quantity),
      metadataHash,
    );
    this.logger.log(`Minting transaction sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }

  async invalidateBatch(onChainBatchId: string) {
    this.ensureContractsReady();
    this.logger.log(`Invoking manual invalidateBatch for ID ${onChainBatchId}`);
    
    const tx = await this.registryContract.invalidateBatch(BigInt(onChainBatchId));
    this.logger.log(`Invalidation transaction sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }

  async getOnChainBatchStatus(onChainBatchId: string) {
    this.ensureContractsReady();
    const batch = await this.registryContract.batches(BigInt(onChainBatchId));
    return {
      id: batch.id.toString(),
      producer: batch.producer,
      stateDigest: batch.stateDigest,
      quantity: Number(batch.quantity),
      verified: batch.verified,
      isInvalid: batch.isInvalid
    };
  }

  async verifyBatch(onChainBatchId: string, quantity: number) {
    this.ensureContractsReady();
    this.logger.log(`Invoking verifyBatch for ID ${onChainBatchId} with quantity ${quantity}`);

    if (!onChainBatchId) {
      throw new Error(`verifyBatch called with invalid onChainBatchId: ${onChainBatchId}`);
    }
    if (!quantity || quantity <= 0) {
      throw new Error(`verifyBatch called with invalid quantity: ${quantity}`);
    }

    const tx = await this.registryContract.verifyBatch(
      BigInt(onChainBatchId),
      BigInt(quantity),
    );
    this.logger.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    return tx.hash;
  }

  async retireCredits(
    onChainBatchId: string, 
    walletAddress: string, 
    amount: number,
    batchTotalQuantity: number,
    metadataHash: string
  ) {
    this.ensureContractsReady();
    const normalizedWalletAddress = this.normalizeAddress(walletAddress, 'buyer wallet');
    this.logger.log(`Invoking retireCredits for ID ${onChainBatchId}, wallet ${normalizedWalletAddress}, amount ${amount}`);

    if (!onChainBatchId) {
      throw new Error(`retireCredits called with invalid onChainBatchId: ${onChainBatchId}`);
    }
    if (!amount || amount <= 0) {
      throw new Error(`retireCredits called with invalid amount: ${amount}`);
    }

    const tx = await this.registryContract.retireCredits(
      BigInt(onChainBatchId),
      normalizedWalletAddress,
      BigInt(amount),
      BigInt(batchTotalQuantity),
      metadataHash
    );
    this.logger.log(`Retirement transaction sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }

  async transferCredits(
    onChainBatchId: string, 
    fromWalletAddress: string, 
    toWalletAddress: string, 
    amount: number,
    batchTotalQuantity: number,
    metadataHash: string
  ) {
    this.ensureContractsReady();
    const normalizedFromAddress = this.normalizeAddress(fromWalletAddress, 'seller wallet');
    const normalizedToAddress = this.normalizeAddress(toWalletAddress, 'buyer wallet');
    this.logger.log(
      `Invoking transferCredits for ID ${onChainBatchId}, from ${normalizedFromAddress}, to ${normalizedToAddress}, amount ${amount}`,
    );

    if (!onChainBatchId) {
      throw new Error(`transferCredits called with invalid onChainBatchId: ${onChainBatchId}`);
    }
    if (!amount || amount <= 0) {
      throw new Error(`transferCredits called with invalid amount: ${amount}`);
    }

    const tx = await this.registryContract.transferCredits(
      BigInt(onChainBatchId),
      normalizedFromAddress,
      normalizedToAddress,
      BigInt(amount),
      BigInt(batchTotalQuantity),
      metadataHash
    );
    this.logger.log(`Transfer transaction sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }

  getMintingHash(producerWallet: string, metadataHash: string, quantity: number): string {
    const normalizedProducer = this.normalizeAddress(producerWallet, 'producer wallet');
    return ethers.solidityPackedKeccak256(
      ['address', 'uint256', 'string'],
      [normalizedProducer, BigInt(quantity), metadataHash]
    );
  }

  async getOnChainTotals() {
    this.ensureContractsReady();
    try {
      const retired = await this.registryContract.totalRetiredUnits();
      return {
        totalRetired: Number(retired),
      };
    } catch (err) {
      this.logger.error('Failed to fetch on-chain totals:', err);
      return { totalRetired: 0 };
    }
  }

  async setOnChainRole(walletAddress: string, role: string, grant: boolean) {
    this.ensureContractsReady();
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
      case 'MINTER':
        roleHash = await this.accessControlContract.MINTER_ROLE();
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

  private ensureContractsReady() {
    if (!this.registryContract || !this.accessControlContract) {
      throw new Error('Blockchain contracts are not initialized. Check REGISTRY_ADDRESS, ACCESS_CONTROL_ADDRESS, and ADMIN_PRIVATE_KEY.');
    }
  }

  private normalizeAddress(value: string | undefined, label: string) {
    const trimmed = value?.trim().replace(/^['"]|['"]$/g, '');

    if (!trimmed || !ethers.isAddress(trimmed)) {
      throw new Error(`Invalid ${label}: ${value}`);
    }

    return ethers.getAddress(trimmed);
  }
}
