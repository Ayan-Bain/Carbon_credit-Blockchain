# Carbon Credit API Documentation

This document describes the current REST API implemented in the repository.

Documentation policy: whenever an endpoint, auth rule, input shape, or response contract changes, update this file in the same change set.

## Authentication

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/auth/nonce` | `GET` | None | No body | Returns a SIWE nonce. Nonces are kept in memory and are invalidated after server restart or successful login. |
| `/auth/register` | `POST` | None | JSON: `name`, `walletAddress`, optional `role` | Creates a company record. `ADMIN`, `REGULATOR`, and `MINTER` cannot be self-registered. |
| `/auth/login` | `POST` | None | JSON: `message`, `signature` | Verifies the SIWE payload and returns `accessToken` plus the user record. JWT expiry is `1d`. |

Example `POST /auth/register`

```json
{
  "name": "OpenAI",
  "walletAddress": "0x1234...",
  "role": "BUYER"
}
```

Example `POST /auth/login`

```json
{
  "message": "domain: ...",
  "signature": "0xabc..."
}
```

## Admin

All `/admin/*` routes require a valid JWT. Role restrictions are listed below.

| Endpoint | Method | Role | Input Format | Notes |
|---|---|---|---|---|
| `/admin/roles` | `POST` | `ADMIN` | JSON: `walletAddress`, `role`, `grant` | Updates both DB role and on-chain role. |
| `/admin/promote-regulator` | `POST` | `ADMIN` | JSON: `walletAddress` | Convenience wrapper around `/admin/roles` for granting `REGULATOR`. |
| `/admin/batches/pending` | `GET` | `REGULATOR` | No body | Lists batches with status `PENDING`. |
| `/admin/batches/:id/approve` | `POST` | `REGULATOR` | Optional JSON: `quantity` | Approves the credit request in the DB and sets status to `APPROVED`. |
| `/admin/batches/:id/reject` | `POST` | `REGULATOR` | No body | Marks the batch as `REJECTED` in the DB. |

Example `POST /admin/roles`

```json
{
  "walletAddress": "0x1234...",
  "role": "BUYER",
  "grant": true
}
```

Example `POST /admin/batches/:id/approve`

```json
{
  "quantity": 500
}
```

## Credits

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/credits/batches` | `POST` | JWT + `PRODUCER` | `multipart/form-data` with `file` and `quantity` | Uploads file/metadata to IPFS and creates a `PENDING` request record. |
| `/credits/batches/:id/mint` | `POST` | JWT + `MINTER` | No body | Mints the tokens on-chain using the registry contract and sets status to `MINTED`. |
| `/credits/batches` | `GET` | JWT | No body | Returns batches for the authenticated user ID. |
| `/credits/batches/:id` | `GET` | None | Path param: `id` | Returns one batch by ID. |
| `/credits/retire` | `POST` | JWT | JSON: `batchId`, `amount`, optional `purpose` | Validates that the buyer has enough purchased-but-not-yet-retired units for the batch, calls the registry contract to retire them on-chain, and stores a `RetirementRecord`. |

Example `POST /credits/batches` form-data

| Field | Type | Required |
|---|---|---|
| `file` | File upload | Yes |
| `quantity` | Integer as text | Yes |
| `projectName` | Text | No |
| `vintage` | Text | No |
| Any other metadata key | Text | No |

Example `POST /credits/batches/:id/mint`

Returns the newly created on-chain batch ID and transaction hash.

Example `POST /credits/retire`

```json
{
  "batchId": "35096d0b-e94e-4223-966d-a3ed687d2943",
  "amount": 25,
  "purpose": "Q2 2026 offset"
}
```

## Market

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/market/listings` | `POST` | JWT + `PRODUCER` | JSON: `batchId`, `price`, `amount` | Creates a marketplace listing from a verified batch and reserves the listed units in the DB. |
| `/market/listings` | `GET` | None | No body | Returns active listings. |
| `/market/listing` | `GET` | None | No body | Alias of `/market/listings`. |
| `/market/listings/:id/buy` | `POST` | JWT | JSON: `amount` | Transfers the batch tokens on-chain from seller wallet to buyer wallet using the registry contract, then stores a confirmed DB transaction. |

Example `POST /market/listings`

```json
{
  "batchId": "35096d0b-e94e-4223-966d-a3ed687d2943",
  "price": 12.5,
  "amount": 100
}
```

Example `POST /market/listings/:id/buy`

```json
{
  "amount": 20
}
```

## Audit

| Endpoint | Method | Auth | Input Format | Notes |
|---|---|---|---|---|
| `/audit/batch/:id` | `GET` | None | Path param: `id` | Returns batch details plus chronological lifecycle history built from DB batch, listing, purchase, and retirement records. |
| `/audit/company/:id` | `GET` | None | Path param: `id` | Returns company details plus chronological activity history built from DB records. |

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
