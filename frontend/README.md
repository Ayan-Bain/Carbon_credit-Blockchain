# Veridian Ledger - Carbon Credit Registry

A comprehensive Next.js web application implementing a complete carbon credit registry platform with authentication, producer/regulator dashboards, marketplace, and on-chain minting capabilities.

## 🎯 Implemented Designs

### 1. **Authentication & Registration**
- **Path:** `/auth`
- **Component:** `AuthRegistration.tsx`
- Full split-screen auth UI with Web3 wallet integration
- Form inputs for entity name, wallet address, and role selection
- MetaMask integration ready
- Branding section with gradient backgrounds and decorative elements

### 2. **Producer Dashboard**
- **Path:** `/producer`
- **Component:** `ProducerDashboard.tsx`
- Dashboard for carbon credit producers to manage submissions
- Total assets overview, verification status tracking
- Batch management with status indicators (minted, pending, approved)
- Registered assets grid showcase
- Sidebar navigation with active state

### 3. **Regulator Dashboard**
- **Path:** `/regulator`
- **Component:** `RegulatorDashboard.tsx`
- Interface for regulators to review and approve carbon credit batches
- Verification queue with expandable batch details
- Audit notes and risk profile assessment
- Approve/reject action buttons
- Stats on pending reviews, audited batches, compliance rates

### 4. **Buyer Marketplace**
- **Path:** `/buyer`
- **Component:** `BuyerMarketplace.tsx`
- Browse verified carbon credit projects
- Advanced filtering and sorting capabilities
- Portfolio management and credit retirement interface
- Active holdings tracking with allocation overview
- Project cards with pricing, availability, and purchase options

### 5. **Minting Queue Dashboard**
- **Path:** `/minting`
- **Component:** `MintingQueueDashboard.tsx`
- Execute on-chain minting of regulator-approved batches
- Network status indicator (Mainnet/Testnet)
- Ready-to-mint batches with progress tracking
- Active batches table with minting action buttons
- Recent on-chain transaction logs

### 6. **Edit User Roles Modal** (Demo)
- **Modal:** `EditUserRolesModal.tsx`
- Dialog for managing user permissions and role assignments
- Base role selection (Producer/Buyer)
- Permission promotion checkboxes (Minter, Regulator)
- Warning alerts for sensitive role changes
- Accessible from homepage

## 🏠 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page with design showcase
│   │   ├── globals.css             # Global styles
│   │   ├── auth/page.tsx           # Auth page
│   │   ├── producer/page.tsx       # Producer dashboard page
│   │   ├── regulator/page.tsx      # Regulator dashboard page
│   │   ├── buyer/page.tsx          # Buyer marketplace page
│   │   └── minting/page.tsx        # Minting queue page
│   ├── components/
│   │   ├── AuthRegistration.tsx         # Auth component
│   │   ├── ProducerDashboard.tsx        # Producer dashboard
│   │   ├── RegulatorDashboard.tsx       # Regulator dashboard
│   │   ├── BuyerMarketplace.tsx         # Buyer marketplace
│   │   ├── MintingQueueDashboard.tsx    # Minting queue
│   │   ├── EditUserRolesModal.tsx       # User roles modal
│   │   ├── SideNavigation.tsx           # Reusable sidebar
│   │   ├── StatCard.tsx                 # Reusable stat card
│   │   ├── BatchCard.tsx                # Batch card component
│   │   └── ProjectCard.tsx              # Project card component
│   └── lib/
│       └── design-tokens.ts        # Design system colors, spacing, fonts
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── postcss.config.js
```

## 🎨 Design System

### Color Palette
- **Primary Dark:** `#012d1d` (Very Dark Green)
- **Primary:** `#1b4332` (Forest Green)
- **Accent:** `#6bfe9c` (Bright Green)
- **Success:** `#13bf66` (Lime Green)
- **Light Background:** `#f4fafd` (Almost White)
- **Text Dark:** `#012d1d`
- **Text Medium:** `#414844`
- **Text Light:** `#717973`
- **Borders:** `#e2e9ec`

### Typography
- **Headings:** Manrope (Bold, ExtraBold)
- **Body:** Inter (Regular, Medium, SemiBold)
- **Monospace:** Liberation Mono (for wallet addresses, hashes)

### Spacing Scale
- `xs: 4px`, `sm: 8px`, `md: 12px`, `lg: 16px`
- `xl: 24px`, `2xl: 32px`, `3xl: 48px`

### Components Library
- `SideNavigation` - Reusable sidebar with nav items
- `StatCard` - Display statistics with optional progress bar
- `BatchCard` - Carbon batch card with status badges
- `ProjectCard` - Project showcase card with pricing
- `EditUserRolesModal` - Permission management modal

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build & Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## 📋 Features Implemented

✅ Full TypeScript support with type-safe components
✅ Responsive design that works on all screen sizes
✅ Tailwind CSS utility-first styling
✅ Reusable component system
✅ Consistent design tokens and color palette
✅ Interactive forms with state management
✅ Modal dialogs with smooth animations
✅ Sidebar navigation with active states
✅ Data tables with sortable columns
✅ Status badge system
✅ Progress indicators
✅ Hover and transition effects
✅ Accessible form inputs and buttons

## 🔌 Integration Points

### Environment Variables
Create a `.env.local` file for configuration:
```env
# Add your environment variables here
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Web3 Integration Ready
- MetaMask wallet connection button
- Wallet address input fields
- On-chain transaction logging
- Network status indicators

### API Integration
All dashboards are structured to easily connect to backend APIs:
- Producer batch submissions
- Regulator verification queue
- Marketplace project listing
- On-chain minting execution

## 📚 Technology Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 3** - Styling
- **ESLint 9** - Code quality
- **Node.js 24+** - Runtime

## 🎓 Design System Documentation

All designs follow a consistent design system with:
- Unified color tokens
- Consistent spacing and layout grid
- Reusable component patterns
- Status badge system
- Interactive states (hover, active, disabled)
- Shadow and blur effects

See `src/lib/design-tokens.ts` for all design tokens.

## 📝 License

MIT

