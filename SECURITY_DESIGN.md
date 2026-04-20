# 🛡️ Security Design & Integrity Framework

This document outlines the multi-layered security architecture of the Carbon Credit Tracking System, focusing on the **Zero-Trust Integrity Framework**.

## 1. The Core Philosophy: "Verification, Not Trust"

The system operates on the principle that the database (PostgreSQL) is a "Mirror of Truth," but the Blockchain is the "Source of Truth." The security model ensures that even if an attacker gains full administrative access to the backend database, they cannot commit fraudulent activity without being detected and blocked by the on-chain enforcement layer.

## 2. Security Layers

### Layer 1: Cryptographic State Locking
When a Regulator approves a batch, the critical metadata (Quantity, IPFS Metadata Hash) is recorded on the Ethereum blockchain.
- **On-chain Guard**: The `CreditRegistry.sol` contract enforces that once a batch is verified, its quantity and metadata cannot be changed.
- **Reference Hash**: The API stores the `onChainBatchId` which serves as a pointer to this immutable record.

### Layer 2: Active Poison Pill (BEYOND_REPAIR)
The "Poison Pill" is an administrative nuclear option for Regulators to preserve market integrity.
- **Action**: If a batch is found to have fraudulent origins after being minted, a Regulator can call `invalidateBatch(batchId)` on-chain.
- **Effect**: This permanently flips a flag on the smart contract. Any attempt to buy or retire these tokens will revert, effectively "poisoning" the batch and preventing any further movement.
- **Cleanup**: The backend sets the DB status to `BEYOND_REPAIR`, removing it from the marketplace immediately.

### Layer 3: Forensic Audit Trail
Every transition in the lifecycle (Submission → Approval → Minting → Sale → Retirement) is logged in the `AuditLog` table.
- **Structured Payloads**: Logs contain the specific delta of the operation (e.g., who bought from whom).
- **Audit Verification**: The `AuditService` can reconstruct the history of an asset from these logs to verify its provenance.

### Layer 4: Role-Based Access Control (RBAC & SIWE)
- **SIWE (Sign-In with Ethereum)**: Authentication is strictly wallet-based. There are no passwords to steal; only a private key holder can authenticate.
- **On-Chain Roles**: Key roles (Regulator, Minter) are mirrored in `CarbonAccessControl.sol`. The backend verifies these roles via smart contract calls before executing sensitive logic.

## 3. Integrity Scanner (The "Watchdog")
The `IntegrityService` runs background checks to find discrepancies:
- **Discrepancy Detection**: It compares the `Quantity` in the database against the `Quantity` stored on-chain.
- **Automatic Alerting**: If a mismatch is found (potentially indicating manual DB tampering), the batch is flagged in the Admin panel.
- **Manual Restoration**: Admins can use the `/admin/integrity/revert` endpoint to force the database back into sync with the blockchain's "Gold Standard."

## 4. IPFS Evidence Persistence
All proof-of-work documents are stored on IPFS.
- **Content Addressing**: Files are accessed via CID (Content Identifier).
- **Tamper Evidence**: If a file is modified, its CID changes, which would immediately break the link stored on-chain, exposing the tampering.
