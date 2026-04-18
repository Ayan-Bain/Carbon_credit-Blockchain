import { PrismaPg } from '@prisma/adapter-pg';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env at the very beginning
const envPath = path.join(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️ Warning: Could not load .env from ${envPath}`);
}


const REGISTRY_ABI = [
  'function submitBatch(string memory _metadataHash) external returns (uint256)',
  'function mintBatch(address _producer, string memory _metadataHash, uint256 _quantity) external returns (uint256)',
  'function verifyBatch(uint256 _batchId, uint256 _quantity) external',
  'function transferCredits(uint256 _batchId, address _from, address _to, uint256 _amount) external',
  'function retireCredits(uint256 _batchId, address _account, uint256 _amount) external',
  'event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash)',
];

const ACCESS_CONTROL_ABI = [
  'function grantRole(bytes32 role, address account) external',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function PRODUCER_ROLE() view returns (bytes32)',
  'function REGULATOR_ROLE() view returns (bytes32)',
  'function BUYER_ROLE() view returns (bytes32)',
  'function MINTER_ROLE() view returns (bytes32)',
];

async function grantRoleIfMissing(
  accessControl: ethers.Contract,
  role: string,
  account: string,
) {
  const hasRole = await accessControl.hasRole(role, account);
  if (hasRole) {
    return;
  }

  await (await accessControl.grantRole(role, account)).wait();
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    console.log('\n🚀 Starting Blockchain Resurrection...');
    console.log(`📡 Using DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Loaded' : '❌ NOT LOADED'}`);
  
    const rpcUrl = (process.env.RPC_URL || 'http://127.0.0.1:8545').trim();
    const privateKey = process.env.ADMIN_PRIVATE_KEY?.trim();
    const registryAddr = process.env.REGISTRY_ADDRESS?.trim().replace(/^['"]|['"]$/g, '');
    const accessControlAddr = process.env.ACCESS_CONTROL_ADDRESS?.trim().replace(/^['"]|['"]$/g, '');
  
    if (!privateKey || !registryAddr || !accessControlAddr) {
      console.error('❌ Missing environment variables. Please check your .env file.');
      process.exit(1);
    }
  
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const baseWallet = new ethers.Wallet(privateKey, provider);
    const wallet = new ethers.NonceManager(baseWallet);
    console.log(`Connected to ${rpcUrl} as ${baseWallet.address}`);
  
    const registry = new ethers.Contract(registryAddr, REGISTRY_ABI, wallet);
    const accessControl = new ethers.Contract(accessControlAddr, ACCESS_CONTROL_ABI, wallet);

    const defaultAdminRole = await accessControl.DEFAULT_ADMIN_ROLE();
    const hasDefaultAdminRole = await accessControl.hasRole(defaultAdminRole, baseWallet.address);

    if (!hasDefaultAdminRole) {
      throw new Error(
        `Signer ${baseWallet.address} is missing DEFAULT_ADMIN_ROLE on ${accessControlAddr}. ` +
        'Use the deployer/admin private key for this network or grant that role before running resurrect.',
      );
    }
  
    // 1. Recover Roles
    console.log('\n👥 Recovering Roles...');
    const companies = await prisma.company.findMany();
    
    const PRODUCER_ROLE = await accessControl.PRODUCER_ROLE();
    const REGULATOR_ROLE = await accessControl.REGULATOR_ROLE();
    const BUYER_ROLE = await accessControl.BUYER_ROLE();
    const MINTER_ROLE = await accessControl.MINTER_ROLE();
  
    for (const company of companies) {
      console.log(`Processing roles for ${company.name} (${company.walletAddress})...`);
      
      // Grant roles based on DB
      if (company.role.toString() === 'PRODUCER' || company.role.toString() === 'BOTH') {
        await grantRoleIfMissing(accessControl, PRODUCER_ROLE, company.walletAddress);
      }
      if (company.role.toString() === 'REGULATOR' || company.role.toString() === 'BOTH' || company.role.toString() === 'ADMIN') {
        await grantRoleIfMissing(accessControl, REGULATOR_ROLE, company.walletAddress);
      }
      if (company.role.toString() === 'ADMIN' || company.role.toString() === 'MINTER') {
        await grantRoleIfMissing(accessControl, MINTER_ROLE, company.walletAddress);
      }
      // All get buyer role
      await grantRoleIfMissing(accessControl, BUYER_ROLE, company.walletAddress);
    }
    
    // Ensure Admin/Server wallet has necessary roles
    const adminAddress = process.env.ADMIN_WALLET_ADDRESS?.trim();
    if (adminAddress) {
      console.log('Ensuring Admin wallet has REGULATOR and MINTER roles...');
      await grantRoleIfMissing(accessControl, REGULATOR_ROLE, adminAddress);
      await grantRoleIfMissing(accessControl, MINTER_ROLE, adminAddress);
    }
  
    // 2. Recover Batches
    console.log('\n📦 Recovering Batches...');
    
    // First, clear all onChainBatchIds to avoid uniqueness constraint violations during update
    await prisma.creditBatch.updateMany({
      data: { onChainBatchId: null }
    });
  
    const batches = await prisma.creditBatch.findMany({
      include: { producer: true },
      orderBy: { submittedAt: 'asc' }
    });
  
    const batchIdMap: Record<string, string> = {}; // DB UUID -> New On-Chain ID
  
    for (const batch of batches) {
      console.log(`Resurrecting Batch ${batch.id} (Quantity: ${batch.quantity}, Status: ${batch.status})...`);
  
      let newOnChainId: string | undefined;
      const statusStr = batch.status.toString();
  
      // Any status that implies it was previously on-chain
      if (statusStr !== 'REJECTED') {
        // Use mintBatch for batches to ensure they are verified on-chain
        const mintTx = await registry.mintBatch(
          batch.producer.walletAddress,
          batch.metadataIPFSHash,
          BigInt(batch.quantity)
        );
        const receipt = await mintTx.wait();
        const event = receipt.logs.find((l: any) => {
          try {
            const parsed = registry.interface.parseLog(l);
            return parsed?.name === 'BatchSubmitted';
          } catch (e) { return false; }
        });
        if (event) {
          newOnChainId = registry.interface.parseLog(event)?.args[0].toString();
        }
      }
  
      if (newOnChainId) {
        console.log(`  - New On-Chain ID: ${newOnChainId}`);
        batchIdMap[batch.id] = newOnChainId;
  
        await prisma.creditBatch.update({
          where: { id: batch.id },
          data: { 
            onChainBatchId: newOnChainId
          }
        });
      }
    }
  
    // 3. Recover Transactions
    console.log('\n💸 Recovering Transactions...');
    const transactions = await prisma.transaction.findMany({
      include: { listing: { include: { batch: true } }, buyer: true },
      orderBy: { createdAt: 'asc' }
    });
  
    for (const txRecord of transactions) {
      if (txRecord.status.toString() !== 'CONFIRMED') continue;
  
      const newOnChainId = batchIdMap[txRecord.listing.batch.id];
      if (!newOnChainId) continue;
  
      console.log(`Re-playing Transaction for ${txRecord.unitsPurchased} units of batch ${newOnChainId}...`);
      const seller = await prisma.company.findUnique({ where: { id: txRecord.listing.sellerId } });
      if (!seller) continue;
  
      const transferTx = await registry.transferCredits(
        BigInt(newOnChainId),
        seller.walletAddress,
        txRecord.buyer.walletAddress,
        BigInt(txRecord.unitsPurchased)
      );
      await transferTx.wait();
  
      await prisma.transaction.update({
        where: { id: txRecord.id },
        data: { onChainTxHash: transferTx.hash }
      });
    }
  
    // 4. Recover Retirements
    console.log('\n🔥 Recovering Retirements...');
    const retirements = await prisma.retirementRecord.findMany({
      include: { batch: true, buyer: true },
      orderBy: { retiredAt: 'asc' }
    });
  
    for (const ret of retirements) {
      const newOnChainId = batchIdMap[ret.batch.id];
      if (!newOnChainId) continue;
  
      console.log(`Re-playing Retirement of ${ret.unitsRetired} units for batch ${newOnChainId}...`);
      const retireTx = await registry.retireCredits(
        BigInt(newOnChainId),
        ret.buyer.walletAddress,
        BigInt(ret.unitsRetired)
      );
      await retireTx.wait();
  
      await prisma.retirementRecord.update({
        where: { id: ret.id },
        data: { onChainTxHash: retireTx.hash }
      });
    }
  
    console.log('\n✨ Resurrection Complete! All roles, batches, and transactions are synced to the new chain.');
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Resurrection Failed:', e);
    process.exit(1);
  });
