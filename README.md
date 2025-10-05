# AfriHealth Ledger

A Hedera-native, privacy-preserving healthcare and insurance platform that gives patients granular control over data access, enables providers to request consent and log itemized billing, automates payments via AI-assisted policies and oracles, and introduces an on-ledger community insurance pool.

## Overview

AfriHealth Ledger targets three intertwined problems in African healthcare:
- Patient-controlled data access and consent portability across providers
- Transparent, itemized billing and near-instant settlement with user acceptance
- Inclusive risk pooling through an on-ledger micro-insurance pool with automated, fraud-resistant claims workflows

## Architecture

### Smart Contracts (Foundry + EIP-2535 Diamond)
- **Diamond.sol**: Proxy and fallback routing with modular facets
- **ConsentFacet**: Granular consent management with scopes and time bounds
- **BillingFacet**: Itemized billing with AI policy checks and automated settlement
- **InsurancePoolFacet**: Community insurance pool with premium and claims management
- **TokenFacet**: HTS integration for platform credits and pool tokens

### Frontend (React + TypeScript)
- **Patient UI**: Health records, consent management, billing approvals, insurance claims
- **Provider UI**: Patient management, consent requests, billing creation, claims submission
- **Admin Console**: Pool configuration, governance, fraud monitoring

### Key Integrations
- **Hedera Services**: HTS (tokens), HCS (consensus), SCS (smart contracts)
- **Chainlink**: Automation and Functions for oracles and scheduled tasks
- **AI Policy Engine**: Patient-configurable payment rules with explainable decisions

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (package manager)
- Foundry (for smart contracts)
- Hedera testnet account

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd afrihealth-ledger
ppnpm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your Hedera account details and API keys
```

3. **Smart contracts:**
```bash
cd contracts
forge install
forge build
forge test
```

4. **Frontend:**
```bash
pnpm run dev
```

## Project Structure

```
afrihealth-ledger/
├── contracts/           # Foundry smart contracts (EIP-2535 Diamond)
├── frontend/           # React TypeScript application
├── backend/            # API services and integrations
├── docs/              # Specifications and documentation
└── scripts/           # Deployment and utility scripts
```

## License

MIT License - see LICENSE file for details.
