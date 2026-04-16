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
    'function mintBatch(address _producer, string memory _metadataHash, uint256 _quantity) external returns (uint256)',
    'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
    'function transferCredits(uint256 _batchId, address _from, address _to, uint256 _amount) external',
    'function retireCredits(uint256 _batchId, address _account, uint256 _amount) external',
    'function batches(uint256) view returns (uint256 id, address producer, string metadataHash, uint256 quantity, uint256 submittedAt, bool verified)',
    'event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash)',
    'event BatchVerified(uint256 indexed batchId, address indexed producer, uint256 amount)',
    'event CreditsTransferred(uint256 indexed batchId, address indexed from, address indexed to, uint256 amount)',
    'event CreditsRetired(uint256 indexed batchId, address indexed account, uint256 amount)',
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

  async mintBatch(producerWallet: string, metadataHash: string, quantity: number) {
    this.ensureContractsReady();
    this.logger.log(`Invoking mintBatch for producer ${producerWallet}, hash ${metadataHash}, quantity ${quantity}`);

    const normalizedProducer = this.normalizeAddress(producerWallet, 'producer wallet');
    
    const tx = await this.registryContract.mintBatch(
      normalizedProducer,
      metadataHash,
      BigInt(quantity),
    );
    this.logger.log(`Mint transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    
    // Parse logs to find BatchSubmitted event and get the ID
    const event = receipt.logs.find((l: any) => {
      try {
        const parsed = this.registryContract.interface.parseLog(l);
        return parsed?.name === 'BatchSubmitted';
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

  async retireCredits(onChainBatchId: string, walletAddress: string, amount: number) {
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
    );
    this.logger.log(`Retirement transaction sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }

  async transferCredits(onChainBatchId: string, fromWalletAddress: string, toWalletAddress: string, amount: number) {
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
    );
    this.logger.log(`Transfer transaction sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
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
