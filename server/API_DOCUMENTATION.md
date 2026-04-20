# Carbon Credit API Documentation

This document describes the current REST API implemented in the repository.

Documentation policy: whenever an endpoint, auth rule, input shape, or response contract changes, update this file in the same change set.

## Authentication

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/auth/nonce` | `GET` | None | No body | Returns a SIWE nonce. |
| `/auth/register` | `POST` | None | JSON: `name`, `walletAddress`, optional `role` | Creates a company record. |
| `/auth/login` | `POST` | None | JSON: `message`, `signature` | Verifies SIWE and returns `accessToken`. |
| `/auth/profile` | `GET` | `JWT` | No body | Returns own profile details. |
| `/auth/company/:id` | `GET` | None | No body | Resolves a company ID to its basic details (name, etc.). |

## Admin

| Endpoint | Method | Role | Input Format | Notes |
|---|---|---|---|---|
| `/admin/roles` | `POST` | `ADMIN` | JSON: `walletAddress`, `role`, `grant` | Updates role in DB and on-chain. |
| `/admin/promote-regulator` | `POST` | `ADMIN` | JSON: `walletAddress` | Shortcut to grant `REGULATOR` role. |
| `/admin/batches/pending` | `GET` | `REGULATOR` | No body | Lists batches with status `PENDING`. |
| `/admin/batches/approved` | `GET` | `MINTER`, `ADMIN` | No body | Lists batches with status `APPROVED` ready for minting. |
| `/admin/batches/:id/approve` | `POST` | `REGULATOR` | Optional JSON: `quantity` | Sets status to `APPROVED`. |
| `/admin/batches/:id/reject` | `POST` | `REGULATOR` | No body | Sets status to `REJECTED`. |
| `/admin/regulator/stats` | `GET` | `REGULATOR` | No body | Lifetime stats (verified, rejected) for the regulator. |

## Credits

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/credits/batches` | `POST` | `PRODUCER` | `multipart/form-data` | Submit new credit batch. |
| `/credits/batches/:id/mint` | `POST` | `MINTER` | No body | Mints tokens on-chain; status → `MINTED`. |
| `/credits/batches` | `GET` | Authenticated | No body | Returns batches for the current user. |
| `/credits/batches/:id` | `GET` | None | No body | Returns one batch by ID. |
| `/credits/batches/:id/metadata` | `GET` | None | No body | Returns off-chain metadata from IPFS. |
| `/credits/batches/:id/download` | `GET` | None | No body | Streams the binary proof file from IPFS. |
| `/credits/batches/:id/invalidate` | `POST` | `REGULATOR`, `ADMIN` | No body | Manually locks a batch (Poison Pill). Sets status to `BEYOND_REPAIR` and invalidates on-chain if present. |
| `/credits/retire` | `POST` | Authenticated | JSON: `batchId`, `amount`, `purpose` | Retirement of credits (burn). |
| `/credits/portfolio` | `GET` | Authenticated | No body | Returns total owned credits across all batches. |

## Market

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/market/listings` | `POST` | `PRODUCER` | JSON: `batchId`, `price`, `amount` | List verified credits. |
| `/market/listings` | `GET` | None | No body | Browse active listings. |
| `/market/listings/:id/buy` | `POST` | Authenticated | JSON: `amount` | Purchase credits; decrements `remainingQuantity` in batch. |

## Audit

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `GET` | `/audit/batch/:id` | None | No body | Full lifecycle history of a batch. |
| `GET` | `/audit/company/:id` | None | No body | Returns `{ company, history: AuditLog[] }`. |
| `GET` | `/audit/company/me` | `JWT` | No body | Returns transaction history for the authenticated user. |
| `GET` | `/audit/company/stats` | `JWT` | No body | Performance metrics (Producer vs Buyer specific stats). |

## Integrity & Security (Admin Only)

| Endpoint | Method | Role | Input Format | Notes |
|---|---|---|---|---|
| `/admin/integrity/check` | `GET` | `ADMIN` | No body | Triggers a scan to find mismatches between DB and Blockchain. |
| `/admin/integrity/mismatches` | `GET` | `ADMIN` | No body | Returns a list of detected integrity violations. |
| `/admin/integrity/revert/:id` | `POST` | `ADMIN` | No body | Attempts to sync DB back to the blockchain "Gold Standard". |

## Audit Log Payload Reference

The `AuditLog` model uses a `payload` JSON field. Common shapes:

- **SALE**: `{ buyerId, sellerId, amount, listingId }`
- **RETIREMENT**: `{ buyerId, amount, purpose }`
- **APPROVAL**: `{ approvedQuantity, onChainBatchId, metadataHash, adjusted }`
- **SUBMISSION**: `{ quantity, location, producerId }`
- **MINTING**: `{ quantity, metadataHash }`
- **SECURITY_LOCK**: `{ reason, wasOnChain }`


## On-chain vs DB Behavior

| Endpoint | On-chain action | DB write | Status Transition |
|---|---|---|---|
| `POST /auth/register` | No | Yes | N/A |
| `POST /admin/roles` | Yes | Yes | N/A |
| `POST /credits/batches` | No | Yes | `PENDING` |
| `POST /admin/batches/:id/approve` | Yes (`recordApproval`) | Yes | `APPROVED` |
| `POST /credits/batches/:id/mint` | Yes (`executeMinting`) | Yes | `MINTED` |
| `POST /credits/batches/:id/invalidate` | Yes (`invalidateBatch`) | Yes | `BEYOND_REPAIR` |
| `POST /market/listings` | No | Yes | `LISTED` |
| `POST /market/listings/:id/buy` | Yes (Registry Verify) | Yes | `SOLD_OUT` (if units=0) |
| `POST /credits/retire` | Yes (`retireCredits`) | Yes | N/A |

## Notes

- The backend signs blockchain actions with the configured admin/regulator private key from `backend/.env`.
- `POST /credits/retire` assumes the buyer's on-chain balance came from prior marketplace purchases handled through `POST /market/listings/:id/buy`.
- `GET /credits/batches` requires a JWT but does not use query filters or request body input.
