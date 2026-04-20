# 🌿 Carbon Credit Tracking System

A blockchain-based carbon credit tracking system built as a monorepo. Carbon credit **producers** submit batches of credits, a **regulatory committee** verifies them on-chain, and **buyers** can purchase and retire those credits — all with a tamper-proof audit trail.

---

## 📁 Project Structure

```
carbon_credit_monorepo/
├── frontend/           # Next.js 14 Real-time Dashboard (The Control Plane)
└── server/             # The Trust Engine (Multi-layered security)
    ├── backend/        # NestJS REST API (off-chain layer)
    ├── blockchain/     # Hardhat smart contracts
    ├── scripts/        # Deployment utilities
    └── shared/         # Shared DTOs and Logic
├── docker-compose.yml  # Infrastructure as Code
└── package.json        # Workspace configuration
```

---

## 🏗️ Architecture Overview

```
Clients (Producer / Regulator / Buyer)
           │
           ▼
    NestJS REST API  ─────────────────────────────────────────────┐
    (JWT + SIWE Auth, RBAC)                                        │
           │                                                       │
           ├── PostgreSQL (read cache, off-chain state)           │
           ├── IPFS / Pinata (document storage, hash → on-chain)  │
           └── Ethers.js ──────────────────────────────────────►  │
                                                                   │
                          Ethereum / Local Hardhat Node            │
                          ┌─────────────────────────────┐         │
                          │  CarbonAccessControl.sol     │         │
                          │  CarbonCreditToken.sol       │         │
                          │  CreditRegistry.sol          │         │
                          └─────────────────────────────┘         │
                                        │                         │
                          BlockchainSyncModule (event listener) ──┘
                          (syncs on-chain events back to PostgreSQL)
```

### Key Security Design Decisions

| Decision | Rationale |
|---|---|
| **On-Chain State Lock** | Cryptographic batch details are fixed on-chain upon approval, creating an immutable gold standard. |
| **Active Poison Pill** | Regulators can permanently neutralize a batch (`BEYOND_REPAIR`) if tampering is detected post-approval. |
| **Integrity Checks** | Background indexers and runtime guards verify database integrity against the On-Chain State Lock. |
| **ERC-1155 tokens** | Each batch is a unique token type; retirement via on-chain burn prevents double-counting. |
| **Hybrid On/Off-chain** | Privacy-preserved evidence storage on IPFS; only cryptographic proofs are stored on-chain. |
| **SIWE Auth** | Wallet-based identity eliminates traditional password vulnerabilities. |

---

## 🔗 Smart Contracts

### `CarbonAccessControl.sol`
Extends OpenZeppelin's `AccessControl`. Defines three roles:
- `PRODUCER_ROLE` — Companies that generate carbon credits
- `REGULATOR_ROLE` — The regulatory committee (also granted to `CreditRegistry` to allow minting)
- `BUYER_ROLE` — Companies purchasing credits
- `DEFAULT_ADMIN_ROLE` — Deployer; can grant/revoke all roles

### `CarbonCreditToken.sol`
An **ERC-1155** token contract. Each credit batch minted corresponds to a unique `tokenId` (the on-chain `batchId`). Only addresses with `REGULATOR_ROLE` can call `mint()`.

### `CreditRegistry.sol`
The core registry for credit batches:
- `submitBatch(metadataHash)` — Called by producers; stores IPFS hash on-chain and emits `BatchSubmitted`
- `verifyBatch(batchId, quantity)` — Called by regulators; verifies the batch and mints ERC-1155 tokens to the producer, emits `BatchVerified`

---

## 🖥️ Backend Modules

| Module | Responsibility |
|---|---|
| `AuthModule` | SIWE identity management and Wallet-based RBAC. |
| `CreditsModule` | Secure submission, Minting Queue, and **Batch Invalidation (Poison Pill)**. |
| `AdminModule` | Regulator workflows: approval, rejection, and on-chain record locking. |
| `MarketModule` | Marketplace services with real-time inventory tracking. |
| `AuditModule` | Structured Forensic Logs for every state transition in the lifecycle. |
| `BlockchainSyncModule` | Real-time synchronization between on-chain events and DB state. |

---

## 🗄️ Database Models (PostgreSQL via Prisma)

- **`Company`** — Registered entities (Producers, Regulators, Buyers, Admins, Minters).
- **`CreditBatch`** — Asset tracking via states: `PENDING → APPROVED → MINTED → SOLD_OUT` or `BEYOND_REPAIR`.
- **`CreditListing`** — Active market inventory with real-time `availableUnits`.
- **`Transaction`** — Signed trade records and purchase history.
- **`AuditLog`** — Forensic audit trail with structured payload hashing.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) & Docker Compose
- [Hardhat](https://hardhat.org/) (installed via workspace)

### 1. Clone & Install

```bash
git clone <repo-url>
cd carbon_credit_monorepo
npm install
```

### 2. Start Infrastructure (PostgreSQL + Redis)

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5432` (DB: `carbon_db`)
- **Redis** on `localhost:6379`

### 3. Start the Local Blockchain

In a separate terminal:

```bash
cd blockchain
npx hardhat node
```

### 4. Deploy Smart Contracts

```bash
cd server/blockchain
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the printed contract addresses and update `server/backend/.env`:

```
REGISTRY_ADDRESS=<printed CreditRegistry address>
ACCESS_CONTROL_ADDRESS=<printed CarbonAccessControl address>
```

### 5. Configure the Backend

Copy and edit the env file:

```bash
cp server/backend/.env.example server/backend/.env   # or edit .env directly
```

Required variables:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/carbon_db?schema=public"
RPC_URL="http://127.0.0.1:8545"
REGISTRY_ADDRESS="<from deploy output>"
ACCESS_CONTROL_ADDRESS="<from deploy output>"
JWT_SECRET="<your-secret>"
PINATA_API_KEY="<your-pinata-key>"
PINATA_API_SECRET="<your-pinata-secret>"
ADMIN_PRIVATE_KEY="<deployer private key>"
ADMIN_WALLET_ADDRESS="<deployer wallet address>"
```

### 6. Run Database Migrations

```bash
cd server/backend
npx prisma migrate dev
```

### 7. Start the Backend

```bash
cd server/backend
npm run start:dev
```

The API will be available at `http://localhost:3000`.

---

## 🔌 API Endpoints

Full documentation: [`API_DOCUMENTATION.md`](./server/API_DOCUMENTATION.md) | [`SECURITY_DESIGN.md`](./SECURITY_DESIGN.md) | [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md)

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/auth/nonce` | Generate SIWE session nonce | Public |
| POST | `/auth/register` | Register company | Public |
| POST | `/auth/login` | Sign in with wallet signature → returns JWT | Public |
| GET | `/auth/company/:id` | Resolve company ID to details | Public |

### Credits (Producer & Buyer)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/credits/batches` | Submit new credit batch | `PRODUCER` |
| GET | `/credits/batches` | List own batches | Authenticated |
| GET | `/credits/batches/:id` | Get batch details | Public |
| GET | `/credits/batches/:id/download` | Download proof file | Public |
| GET | `/credits/portfolio` | View owned credit balances | Authenticated |
| POST | `/credits/retire` | Retire owned credits (burn) | Authenticated |

### Regulation & Operations
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/admin/batches/pending` | List batches for review | `REGULATOR` |
| GET | `/admin/batches/approved` | List batches for minting | `MINTER` |
| POST | `/admin/batches/:id/approve` | Approve batch | `REGULATOR` |
| POST | `/admin/batches/:id/reject` | Reject batch | `REGULATOR` |
| POST | `/credits/batches/:id/mint` | Mint tokens on-chain | `MINTER` |
| GET | `/admin/regulator/stats` | Regulator performance metrics | `REGULATOR` |

### Marketplace
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/market/listings` | List verified credits for sale | `PRODUCER` |
| GET | `/market/listings` | Browse available listings | Public |
| POST | `/market/listings/:id/buy` | Purchase credits | Authenticated |

### Audit
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/audit/batch/:id` | Lifecycle history of a batch | Public |
| GET | `/audit/company/:id` | Detailed activity for a company | Public |
| GET | `/audit/company/me` | Own transaction history | Authenticated |
| GET | `/audit/company/stats` | Own performance metrics | Authenticated |

---

## 🔄 Credit Lifecycle

```
[Producer] POST /credits/batches
    → Upload document to IPFS → get metadataHash
    → Call submitBatch(metadataHash) on CreditRegistry
    → DB: CreditBatch { status: PENDING }
                ↓
[Regulator] POST /admin/batches/:id/verify
    → Call verifyBatch(batchId, quantity) on CreditRegistry
    → CreditRegistry mints ERC-1155 tokens to producer
    → DB: CreditBatch { status: VERIFIED }
                ↓
[Producer] POST /market/listings
    → DB: CreditListing created
    → DB: CreditBatch { status: LISTED }
                ↓
[Buyer] POST /market/listings/:id/buy
    → DB: Transaction recorded
    → DB: listing.availableUnits decremented
                ↓
[Buyer] POST /credits/retire
    → Call retireCredits on-chain (tokens burned)
    → DB: RetirementRecord saved with burn txHash
```

---

## 🔧 Development Scripts

### Root
```bash
npm install         # Install all workspace dependencies
```

### Backend (`cd backend`)
```bash
npm run start:dev   # Start in watch mode
npm run build       # Compile to dist/
npm run start:prod  # Run compiled server
npm run lint        # Lint & auto-fix
npm run test        # Run unit tests
npm run test:cov    # Run tests with coverage
npx prisma studio   # Open Prisma DB browser
npx prisma migrate dev  # Run & apply new migrations
```

### Blockchain (`cd blockchain`)
```bash
npx hardhat node                                          # Start local node
npx hardhat run scripts/deploy.ts --network localhost     # Deploy contracts
npx hardhat compile                                       # Compile contracts
```

---

## 🛡️ Security Notes

- **Never commit `backend/.env`** — it contains private keys and API secrets. It is `.gitignore`d.
- The `ADMIN_PRIVATE_KEY` in `.env` is the Hardhat default test account key — **replace before any non-local deployment**.
- All regulator and admin actions are double-enforced: once at the API level (JWT + RBAC guard) and once at the smart contract level (role modifier).
- Credit retirement is irreversible on-chain — burned tokens cannot be recovered.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24, Hardhat, OpenZeppelin |
| Backend Framework | NestJS (TypeScript) |
| Auth | JWT + Sign-In with Ethereum (SIWE) |
| Database | PostgreSQL 15 + Prisma ORM |
| Blockchain Client | Ethers.js v6 |
| Document Storage | IPFS via Pinata |
| Infrastructure | Docker Compose (Postgres + Redis) |

---

## 📄 License

MIT LICENSE — [VIEW LICENSE](./LICENSE)
