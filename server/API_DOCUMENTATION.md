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
| `/credits/retire` | `POST` | Authenticated | JSON: `batchId`, `amount`, `purpose` | Retirement of credits (burn). |
| `/credits/portfolio` | `GET` | Authenticated | No body | Returns total owned credits across all batches. |

## Market

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/market/listings` | `POST` | `PRODUCER` | JSON: `batchId`, `price`, `amount` | List verified credits. |
| `/market/listings` | `GET` | None | No body | Browse active listings. |
| `/market/listings/:id/buy` | `POST` | Authenticated | JSON: `amount` | Purchase credits from listing. |

## Audit

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/audit/batch/:id` | `GET` | None | No body | Full lifecycle history of a batch. |
| `/audit/company/:id` | `GET` | None | No body | Activity history for any company. |
| `/audit/company/me` | `GET` | Authenticated | No body | Activity history for the current user. |
| `/audit/company/stats` | `GET` | Authenticated | No body | High-level performance stats for the current user. |


## On-chain vs DB Behavior

| Endpoint | On-chain action | DB write |
|---|---|---|
| `POST /auth/register` | No | Yes |
| `POST /admin/roles` | Yes | Yes |
| `POST /credits/batches` | No | Yes |
| `POST /credits/batches/:id/confirm-onchain` | No | Yes |
| `POST /admin/batches/:id/verify` | Yes | Yes |
| `POST /market/listings` | No | Yes |
| `POST /market/listings/:id/buy` | Yes | Yes |
| `POST /credits/retire` | Yes | Yes |

## Notes

- The backend signs blockchain actions with the configured admin/regulator private key from `backend/.env`.
- `POST /credits/retire` assumes the buyer's on-chain balance came from prior marketplace purchases handled through `POST /market/listings/:id/buy`.
- `GET /credits/batches` requires a JWT but does not use query filters or request body input.
