# 🛠️ Developer Guide

This guide provides deep-dive instructions for developers working in the Carbon Credit Monorepo.

## 📦 Workspace Management

The repository uses **npm workspaces** to manage the frontend and backend.

- `npm install` at the root installs all dependencies.
- `server/` contains the backend and blockchain logic.
- `frontend/` contains the Next.js application.

## 🗄️ Database Workflow (Prisma)

The schema is defined in `server/backend/prisma/schema.prisma`.

### 1. Modifying the Schema
1. Edit `schema.prisma`.
2. Run `npx prisma migrate dev` within `server/backend`.
3. The Prisma client is automatically re-generated.

### 2. Viewing Data
Run `npx prisma studio` in `server/backend` to open a GUI for the database.

## ⛓️ Blockchain Workflow (Hardhat)

Smart contracts are in `server/blockchain/contracts`.

### 1. Compilation
```bash
cd server/blockchain
npx hardhat compile
```

### 2. Testing
```bash
npx hardhat test
```

### 3. Local Node & Deployment
Always run a local node for development:
```bash
npx hardhat node
```
Deploy the contracts to the local node:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

## 🔌 Integrating Frontend with Backend

### API Client
The frontend uses a centralized Axios instance in `frontend/src/lib/api.ts`.

### Authentication Logic
Authentication is managed via `frontend/src/lib/auth-context.tsx`. It handles:
- SIWE (Sign-In with Ethereum)
- JWT storage in `localStorage`
- Role-based redirection

## 🧪 Testing Strategy

- **Backend**: Unit tests for services and controllers in `server/backend/src`.
- **Blockchain**: Contract tests in `server/blockchain/test`.
- **E2E**: Integration tests that simulate a full submission → verification → sale flow.

## 🚩 Common Gotchas

- **Shared Types**: The `server/shared` directory is intended for shared logic between backend and blockchain scripts. If you add a field to the Prisma model, ensure it's reflected in necessary DTOs.
- **Gas Limits**: When deploying to local Hardhat, ensure your `ADMIN_PRIVATE_KEY` has enough test ETH (the first 10 accounts from `hardhat node` have 10,000 ETH each).
- **CORS**: If you add a new service, verify it is accessible from the frontend port (default `3001`).

## 🚨 Disaster Recovery: Chain Resurrection

If the database is lost or corrupted, you can rebuild the state using the blockchain:
```bash
cd server/backend
npm run resurrect
```
This script (`resurrect-chain.ts`) replays all `BatchSubmitted`, `BatchVerified`, and `BatchInvalidated` events to reconstruct the `CreditBatch` and `Company` records.
