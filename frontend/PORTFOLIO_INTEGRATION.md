# Buyer Portfolio Backend Integration Guide

## Overview
The buyer portfolio page (`/buyer/portfolio`) displays the user's carbon credit holdings, recent activity, and portfolio statistics. The frontend components are fully implemented and ready for backend integration.

## Required API Endpoints

### 1. Get Portfolio Holdings
**Endpoint:** `GET /portfolio/holdings`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "data": [
    {
      "id": "holding-uuid",
      "projectName": "Amazonian Reforestation",
      "batchId": "#TRX-99821-X",
      "quantity": 2500,
      "status": "ACTIVE",
      "purchaseDate": "2024-01-15T10:30:00Z",
      "batchNumber": "2023-VCS-AMZ"
    },
    {
      "id": "holding-uuid-2",
      "projectName": "Great Barrier Blue Carbon",
      "batchId": "#TRX-11204-Q",
      "quantity": 1200,
      "status": "ACTIVE",
      "purchaseDate": "2024-02-10T14:22:00Z",
      "batchNumber": "2024-MAR-002"
    },
    {
      "id": "holding-uuid-3",
      "projectName": "Sahara Solar Offset",
      "batchId": "#TRX-88712-Z",
      "quantity": 5000,
      "status": "RETIRED",
      "purchaseDate": "2022-05-20T09:15:00Z",
      "retirementDate": "2024-04-18T11:45:00Z",
      "batchNumber": "2022-GOLD-SOL"
    }
  ]
}
```

**Status Values:** `ACTIVE`, `RETIRED`, `PENDING`

---

### 2. Get Recent Activity
**Endpoint:** `GET /portfolio/activity`

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `limit` (optional, default: 10): Number of recent activities to return
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "data": [
    {
      "id": "activity-uuid",
      "type": "PURCHASE",
      "projectName": "Amazonian Reforestation",
      "date": "2024-05-24T14:30:00Z",
      "amount": 1200,
      "txHash": "0x1234...",
      "description": "Purchased 1,200 tCO2e credits"
    },
    {
      "id": "activity-uuid-2",
      "type": "RETIRED",
      "projectName": "Sahara Solar Offset",
      "date": "2024-04-18T11:45:00Z",
      "amount": 5000,
      "txHash": "0x5678...",
      "description": "Retired 5,000 tCO2e credits"
    },
    {
      "id": "activity-uuid-3",
      "type": "PURCHASE",
      "projectName": "Amazonian Reforestation",
      "date": "2024-03-12T09:20:00Z",
      "amount": 1300,
      "txHash": "0x9012...",
      "description": "Purchased 1,300 tCO2e credits"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

**Activity Types:** `PURCHASE`, `RETIRED`, `TRANSFER`, `DONATED`

---

### 3. Get Portfolio Statistics
**Endpoint:** `GET /portfolio/stats`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "data": {
    "totalCredits": 12450,
    "lifetimeOffset": 8120,
    "portfolioValue": 342800,
    "quarterlyGrowth": "+12%",
    "monthlyGrowth": "+3.5%",
    "totalPurchased": 15200,
    "totalRetired": 8120,
    "totalTransferred": 2500,
    "activeHoldings": 3,
    "retiredHoldings": 5,
    "averagePrice": 27.53,
    "priceRange": {
      "min": 24.50,
      "max": 31.75
    },
    "lastUpdated": "2024-05-25T10:00:00Z"
  }
}
```

---

### 4. Retire Carbon Credits
**Endpoint:** `POST /portfolio/retire/{holdingId}`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "amount": 1000,
  "reason": "Corporate sustainability initiative",
  "verificationDocUrl": "https://example.com/docs/retirement.pdf"
}
```

**Response:**
```json
{
  "data": {
    "id": "retirement-uuid",
    "holdingId": "holding-uuid",
    "amount": 1000,
    "status": "PENDING",
    "txHash": "0xabcd1234...",
    "completedAt": null,
    "certificateUrl": "https://example.com/certificates/retirement-123.pdf"
  },
  "message": "Retirement initiated successfully"
}
```

**Possible Status Values:** `PENDING`, `COMPLETED`, `FAILED`

---

## Component Implementation Details

### BuyerPortfolio Component
- **Location:** `src/components/BuyerPortfolio.tsx`
- **Main Responsibilities:**
  - Fetches portfolio data on mount
  - Manages tab state (Portfolio, Insights, Governance)
  - Handles data loading and error states
  - Provides fallback mock data if API fails

### Sub-Components
1. **PortfolioSideNavigation** - Left sidebar navigation
2. **PortfolioHoldings** - Holdings table with retire functionality
3. **AssetDistribution** - Pie chart showing portfolio composition
4. **RecentActivity** - Timeline of recent transactions

## Design Tokens Integration
All components use design tokens from `lib/design-tokens.ts`:
- **Colors:** Primary colors (darkest, dark, accent, success)
- **Typography:** Manrope (headings), Inter (body)
- **Shadows:** Consistent shadow styling
- **Spacing:** Standardized spacing values

## Error Handling
- API errors are caught and logged
- Mock data is displayed as fallback
- User-friendly error messages are shown
- Network failures are gracefully handled

## Future Enhancements
1. **Insights Tab** - Portfolio performance analytics
2. **Governance Tab** - Voting and participation features
3. **Export Functionality** - CSV/PDF export of holdings
4. **Advanced Filtering** - Filter holdings by status, date range, project type
5. **Real-time Updates** - WebSocket integration for live data
6. **Retirement Verification** - Multi-step retirement process with documentation
