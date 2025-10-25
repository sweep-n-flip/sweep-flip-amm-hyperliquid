# Sweep Flip AMM Hyperliquid

This project is a web application built with Next.js to interact with an Automated Market Maker (AMM) specialized in NFTs on the Hyperliquid platform.

## What is an NFT AMM?

An **NFT AMM** (Automated Market Maker for NFTs) is an automated trading protocol that enables decentralized and efficient exchange of non-fungible tokens (NFTs). Inspired by AMMs like Uniswap for ERC-20 tokens, an NFT AMM uses liquidity pools where users provide pairs of assets (such as ETH and NFTs) to facilitate automatic exchanges.

### How it works:
- **Liquidity Pools**: Users deposit liquidity into specific pools (e.g., a pool for an NFT collection).
- **Automatic Trading**: The protocol automatically calculates prices based on available liquidity, without the need for a traditional order book.
- **Benefits**: Constant liquidity, 24/7 trading, and reduced intermediaries.

This project integrates with Hyperliquid, a cryptocurrency trading platform, to offer features such as NFT swapping, liquidity provision, and market data aggregation.

## Architecture

This is a Next.js application with TypeScript and TailwindCSS for the frontend. The architecture is organized as follows:

- **Components** (`src/components`): Reusable UI components, including swap widgets, tables, and modals.
- **Hooks** (`src/hooks`): Custom React hooks for business logic, such as liquidity management (`useLiquidityFlow`), token approvals (`useTokenApproval`), and transaction settings.
- **Services** (`src/services`): External integrations for APIs like Reservoir, Hyperliquid collections, and subgraph queries.
- **Contexts** (`src/contexts`): Global state management for chain selection and transaction settings.
- **ABIs** (`src/abi`): Smart contract interfaces for ERC-20, factory, and router contracts.
- **App** (`src/app`): Next.js app router pages and global styles.

The app uses wagmi and viem for blockchain interactions, RainbowKit for wallet connections, and TanStack Query for data fetching.

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- pnpm (recommended package manager)

### Installation
```bash
pnpm install
```

### Development
Run the development server on port 3001:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

### Build and Start
```bash
pnpm build
pnpm start
```

The production server runs on port 3002.

### Linting and Type Checking
```bash
pnpm lint
pnpm type-check
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


