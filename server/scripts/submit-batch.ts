/**
 * submit-batch.ts
 * 
 * Calls submitBatch() on the CreditRegistry smart contract from the producer's wallet.
 * Run after POST /credits/batches returns a metadataHash from the backend.
 * 
 * Usage:
 *   node scripts/submit-batch.ts
 * 
 * You will be prompted for:
 *   - Producer private key
 *   - IPFS metadata hash (returned by POST /credits/batches)
 *   - RPC URL (default: http://127.0.0.1:8545)
 *   - CreditRegistry contract address
 *   - (Optional) Backend DB batch ID + JWT to auto-confirm on-chain
 */

const { ethers } = require('ethers');
const readline = require('readline');
const axios = require('axios');

// ── ABI (only what we need) ─────────────────────────────────────────────────
const REGISTRY_ABI = [
  'function submitBatch(string memory _metadataHash) external returns (uint256)',
  'event BatchSubmitted(uint256 indexed batchId, address indexed producer, string metadataHash)',
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string, defaultValue = ''): Promise<string> {
  return new Promise((resolve) => {
    const hint = defaultValue ? ` [${defaultValue}]` : '';
    rl.question(`${question}${hint}: `, (answer: string) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Note: private key is shown in plain text so paste works in all terminals

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Carbon Credit — Submit Batch On-Chain      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. Collect inputs
  const privateKey      = await ask('Producer private key:');
  const metadataHash    = await ask('IPFS metadata hash (from POST /credits/batches response)');
  const rpcUrl          = await ask('RPC URL', 'http://127.0.0.1:8545');
  const registryAddress = await ask('CreditRegistry contract address');

  if (!privateKey || !metadataHash || !registryAddress) {
    console.error('\n❌  All fields are required. Exiting.');
    rl.close();
    process.exit(1);
  }

  // 2. Connect wallet
  console.log('\n⏳  Connecting to network...');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet   = new ethers.Wallet(privateKey, provider);
  const address  = await wallet.getAddress();

  const network = await provider.getNetwork();
  console.log(`✅  Connected — chainId: ${network.chainId}, wallet: ${address}`);

  // 3. Connect to contract
  const registry = new ethers.Contract(registryAddress, REGISTRY_ABI, wallet);

  // 4. Send transaction
  console.log('\n⏳  Sending submitBatch() transaction...');
  let tx: any;
  try {
    tx = await registry.submitBatch(metadataHash);
    console.log(`📤  Transaction sent: ${tx.hash}`);
  } catch (err: any) {
    console.error('\n❌  Transaction failed during gas estimation or send:');
    console.error(err.reason || err.message);
    rl.close();
    process.exit(1);
  }

  // 5. Wait for confirmation
  console.log('⏳  Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log(`✅  Confirmed in block ${receipt.blockNumber}`);

  // 6. Parse BatchSubmitted event to get on-chain batch ID
  const iface = new ethers.Interface(REGISTRY_ABI);
  let onChainBatchId: string | null = null;

  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.name === 'BatchSubmitted') {
        onChainBatchId = parsed.args.batchId.toString();
        break;
      }
    } catch {
      // skip non-matching logs
    }
  }

  if (!onChainBatchId) {
    console.error('\n❌  BatchSubmitted event not found in receipt. Cannot retrieve on-chain batch ID.');
    rl.close();
    process.exit(1);
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║              Submission Result               ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  On-chain Batch ID : ${onChainBatchId}`);
  console.log(`  Tx Hash           : ${tx.hash}`);
  console.log(`  Metadata Hash     : ${metadataHash}`);

  // 7. Optional: auto-confirm in backend DB
  console.log('\n──────────────────────────────────────────────');
  const autoConfirm = await ask('Auto-confirm in backend DB? (y/n)', 'n');

  if (autoConfirm.toLowerCase() === 'y') {
    const backendUrl  = await ask('Backend base URL', 'http://localhost:3000');
    const dbBatchId   = await ask('DB batch ID (from POST /credits/batches response)');
    const jwtToken    = await ask('JWT access token');

    console.log('\n⏳  Calling POST /credits/batches/:id/confirm-onchain...');
    try {
      const res = await axios.post(
        `${backendUrl}/credits/batches/${dbBatchId}/confirm-onchain`,
        { onChainBatchId, txHash: tx.hash },
        { headers: { Authorization: `Bearer ${jwtToken}` } },
      );
      console.log('✅  Backend confirmed:');
      console.log(JSON.stringify(res.data, null, 2));
    } catch (err: any) {
      console.error('❌  Backend confirmation failed:');
      console.error(err.response?.data || err.message);
    }
  } else {
    console.log('\n📋  Run this manually to confirm in the backend:');
    console.log(`
  curl -X POST http://localhost:3000/credits/batches/<DB_BATCH_ID>/confirm-onchain \\
    -H "Authorization: Bearer <JWT_TOKEN>" \\
    -H "Content-Type: application/json" \\
    -d '{"onChainBatchId":"${onChainBatchId}","txHash":"${tx.hash}"}'
`);
  }

  rl.close();
}

main().catch((err) => {
  console.error('\n❌  Unexpected error:', err.message);
  rl.close();
  process.exit(1);
});
