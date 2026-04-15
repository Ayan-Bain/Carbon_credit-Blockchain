# Carbon Credit API Documentation

This document provides a comprehensive overview of all REST API endpoints available in the Carbon Credit System. The endpoints are categorized by their respective modules and the roles authorized to access them.

## 1. Authentication Module
Manage identity and system access using Sign-In with Ethereum (SIWE).

| Endpoint             | Method | Input Format | Result | Transaction Req. | Return Values |
|----------------------|--------|-------------|--------|------------------|---------------|
| `/auth/nonce`        | GET    | None | Generates a unique session nonce | No | Nonce string |
| `/auth/register`     | POST   | JSON (`name`, `walletAddress`, `role`) | New company/wallet record created in DB | No | Company object |
| `/auth/login`        | POST   | JSON (`message`, `signature`) | User authenticated via wallet signature | No | `accessToken` (JWT), User object |

---

## 2. Credit Management Module — Producer
These endpoints allow producers to submit new batches and track their ongoing status.

| Endpoint | Method | Input Format | Result | Transaction Req. | Return Values |
|----------|--------|--------------|--------|------------------|---------------|
| `/credits/batches` | POST | JSON (`file`, metadata) | Credit batch submitted for verification | YES (`submitCreditBatch`) | CreditBatch object with PENDING status |
| `/credits/batches/:id` | GET | Path Param (`id`) | Fetches specific batch details | No | CreditBatch object |
| `/credits/batches` | GET | None (Filters by JWT) | Lists own batches | No | Array of CreditBatch objects |
| `/market/listings` | POST | JSON (`batchId`, `price`, `amount`) | Verified credits listed for sale | YES (`listForSale`) | CreditListing object |

---

## 3. Regulatory Module
Endpoints reserved for regulators to evaluate, approve, or reject submitted credit batches.

| Endpoint | Method | Input Format | Result | Transaction Req. | Return Values |
|----------|--------|--------------|--------|------------------|---------------|
| `/admin/batches/pending` | GET | None | Lists all batches awaiting approval | No | Array of CreditBatch objects |
| `/admin/batches/:id/verify` | POST | Path Param (`id`), JSON (`quantity`) | Batch approved and tokens minted | YES (`verifyCreditBatch`) | Success message & `txHash` |
| `/admin/batches/:id/reject` | POST | Path Param (`id`) | Batch status updated to REJECTED | No | Success message |

---

## 4. Marketplace Module — Buyer
These endpoints enable buyers to browse the marketplace, purchase verified credits, and retire them.

| Endpoint | Method | Input Format | Result | Transaction Req. | Return Values |
|----------|--------|--------------|--------|------------------|---------------|
| `/market/listings` | GET | Query Params (Filters) | Lists available credit listings | No | Array of CreditListing objects |
| `/market/listings/:id/buy` | POST | Path Param (`id`), JSON (`amount`) | Credits purchased and transferred | YES (`purchaseCredits`) | Transaction object & `txHash` |
| `/credits/retire` | POST | JSON (`batchId`, `amount`) | Credits permanently retired (burned) | YES (`retireCredits`) | RetirementRecord object & `txHash` |

---

## 5. Audit & History Module
Public or admin endpoints designed to ensure system transparency and auditability.

| Endpoint | Method | Input Format | Result | Transaction Req. | Return Values |
|----------|--------|--------------|--------|------------------|---------------|
| `/audit/batch/:id` | GET | Path Param (`id`) | Full lifecycle history of a credit batch | No | Lifecycle history object |
| `/audit/company/:id` | GET | Path Param (`id`) | Transaction history for a company | No | Array of Transaction records |
