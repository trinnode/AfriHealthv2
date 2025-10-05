# AfriHealth Ledger - Developer Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Smart Contracts](#smart-contracts)
5. [Backend API](#backend-api)
6. [Frontend](#frontend)
7. [Setup & Installation](#setup--installation)
8. [Development Workflow](#development-workflow)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Contributing](#contributing)

## 🚀 Project Overview

**AfriHealth Ledger** is a revolutionary healthcare platform built on the Hedera blockchain that provides patient-controlled healthcare data management, transparent billing, and AI-assisted policy compliance. The platform uses the Diamond pattern for smart contract architecture, enabling modular and upgradeable healthcare solutions.

### Key Features
- **Patient-Controlled Consent**: Patients have full control over their healthcare data
- **Transparent Billing**: Itemized, verifiable healthcare invoices on-chain
- **AI Policy Integration**: Automated compliance checking with healthcare regulations
- **Insurance Pool Management**: Decentralized insurance with smart contract governance
- **Multi-Role Support**: Patients, Providers, Insurers, and Administrators
- **Emergency Access**: Secure emergency data access protocols

## 🏗️ Architecture

### System Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    AfriHealth Ledger Platform                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Frontend  │  │   Backend   │  │ Smart       │              │
│  │   (React)   │  │   (Node.js) │  │ Contracts   │              │
│  │             │  │             │  │ (Solidity)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Hedera    │  │  PostgreSQL │  │   Redis     │              │
│  │ Blockchain  │  │   Database  │  │   Cache     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Diamond Pattern Architecture
The smart contracts use the EIP-2535 Diamond pattern for modular upgradeability:

```
┌─────────────────────────────────────────────────────────────┐
│                    Diamond Proxy Contract                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Access      │  │ Consent     │  │ Billing     │         │
│  │ Control     │  │ Management  │  │ & Payment   │         │
│  │ Facet       │  │ Facet       │  │ Facet       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Token       │  │ Insurance   │  │ AI Policy   │         │
│  │ Management  │  │ Pool        │  │ Validation  │         │
│  │ Facet       │  │ Facet       │  │ Facet       │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19.2.0 with TypeScript
- **Styling**: Tailwind CSS 3.4.18
- **State Management**: Redux Toolkit 2.9.0
- **Routing**: React Router DOM 7.9.3
- **Charts**: Chart.js 4.5.0 with react-chartjs-2
- **Animations**: Framer Motion 12.23.22
- **Icons**: Heroicons 2.2.0

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Validation**: express-validator
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Compression**: gzip compression
- **Process Management**: Nodemon (development)

### Smart Contracts
- **Language**: Solidity ^0.8.20
- **Development Framework**: Foundry
- **Pattern**: EIP-2535 Diamond Pattern
- **Testing**: Forge testing framework
- **Deployment**: Forge scripts

### Blockchain Integration
- **Network**: Hedera Testnet/Mainnet
- **SDK**: @hashgraph/sdk
- **Consensus**: Hashgraph Consensus Service (HCS)
- **Token Service**: Hedera Token Service (HTS)

### Database & Caching
- **Primary Database**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma (planned)

## 📋 Smart Contracts

### Contract Structure

#### Diamond.sol (Proxy Contract)
- **Purpose**: Main entry point for all contract interactions
- **Pattern**: EIP-2535 Diamond Proxy
- **Storage**: Namespaced storage slots for each facet

#### AccessControlFacet.sol
- **Purpose**: Role-based access control management
- **Roles**:
  - `ADMIN_ROLE`: Contract administration
  - `PATIENT_ROLE`: Patient permissions
  - `PROVIDER_ROLE`: Healthcare provider permissions
  - `INSURER_ROLE`: Insurance company permissions
  - `ARBITRATOR_ROLE`: Dispute resolution
  - `ORACLE_ROLE`: External data validation

#### ConsentFacet.sol
- **Purpose**: Patient consent management
- **Features**:
  - Granular consent scopes (labs, medications, procedures)
  - Time-limited consents
  - Emergency access protocols
  - Consent revocation

#### BillingFacet.sol
- **Purpose**: Healthcare billing and payments
- **Features**:
  - Itemized invoices with CPT/ICD codes
  - Multi-currency support
  - Payment processing (HBAR, HTS, Insurance)
  - Dispute management

#### TokenFacet.sol
- **Purpose**: Platform token management
- **Tokens**:
  - Platform Credit (AHL): Utility token for platform services
  - Insurance Pool Tokens: Insurance participation tokens
  - Reputation NFTs: Provider reputation tracking

#### InsurancePoolFacet.sol
- **Purpose**: Decentralized insurance management
- **Features**:
  - Pool participation
  - Claim submission and processing
  - Automated payouts
  - Risk assessment

#### AIPolicyFacet.sol
- **Purpose**: AI-powered policy compliance
- **Features**:
  - Automated HIPAA compliance checking
  - Policy violation detection
  - Compliance scoring
  - Regulatory reporting

### Contract Deployment

#### Environment Variables Required
```bash
# Hedera Network Configuration
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet  # or mainnet

# Contract Addresses (after deployment)
DIAMOND_CONTRACT_ADDRESS=0.0.CONTRACT_ADDRESS
PLATFORM_CREDIT_TOKEN_ADDRESS=0.0.TOKEN_ADDRESS
INSURANCE_POOL_TOKEN_ADDRESS=0.0.TOKEN_ADDRESS
REPUTATION_NFT_ADDRESS=0.0.NFT_ADDRESS
```

#### Deployment Commands
```bash
# Install dependencies
cd contracts && forge install

# Build contracts
forge build

# Run tests
forge test

# Deploy to testnet
forge script script/DeployAfriHealth.s.sol --rpc-url testnet --broadcast

# Verify deployment
cast call CONTRACT_ADDRESS "facets()" --rpc-url testnet
```

## 🔌 Backend API

### API Architecture

#### Base URL
```
Development: http://localhost:3001
Production: https://api.afrihealth.io
```

#### Response Format
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Authentication Endpoints

#### Wallet Authentication
```http
POST /api/auth/wallet
Content-Type: application/json

{
  "address": "0.0.12345",
  "signature": "base64_signature",
  "message": "authentication_message"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "address": "0.0.12345",
    "expiresIn": "24h"
  }
}
```

#### Token Verification
```http
POST /api/auth/verify
Authorization: Bearer <token>
```

#### Wallet Status Check
```http
GET /api/auth/status/:address
```

### Patient Endpoints

#### Get Patient Dashboard
```http
GET /api/patient/stats/:patientAddress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConsents": 5,
    "activeConsents": 3,
    "pendingInvoices": 2,
    "approvedInvoices": 1,
    "totalClaims": 1,
    "pendingClaims": 0,
    "insuranceCoverage": 10000,
    "monthlySpending": 2500
  }
}
```

#### Get Patient Invoices
```http
GET /api/patient/invoices/:patientAddress?status=pending_approval
```

#### Approve Invoice
```http
POST /api/patient/invoices/:invoiceId/approve
Content-Type: application/json

{
  "approvedAmount": 15000,
  "patientAddress": "0.0.12345"
}
```

#### Submit Insurance Claim
```http
POST /api/patient/claims
Content-Type: application/json

{
  "patientAddress": "0.0.12345",
  "amountRequested": 15000,
  "diagnosis": "Hypertension Management",
  "procedureCodes": ["99213", "85025"]
}
```

### Provider Endpoints

#### Get Provider Dashboard
```http
GET /api/provider/stats/:providerAddress
```

#### Create Consent Request
```http
POST /api/provider/consent-requests
Content-Type: application/json

{
  "providerAddress": "0.0.12345",
  "patientAddress": "0.0.67890",
  "scopes": ["labs", "medications"],
  "purposeOfUse": "Routine checkup and medication review",
  "expiresAt": 1735689600
}
```

#### Create Invoice
```http
POST /api/provider/invoices
Content-Type: application/json

{
  "providerAddress": "0.0.12345",
  "patientAddress": "0.0.67890",
  "lineItems": [
    {
      "description": "General Consultation",
      "code": "99213",
      "quantity": 1,
      "unitPrice": 15000,
      "totalPrice": 15000,
      "category": "consultation"
    }
  ],
  "currency": "USD",
  "expiresAt": 1735689600,
  "notes": "Follow-up consultation"
}
```

#### Get Provider Analytics
```http
GET /api/provider/analytics/:providerAddress?range=90d
```

### Contract Management Endpoints

#### Get Contract Information
```http
GET /api/contracts/info
```

#### Deploy Contracts
```http
POST /api/contracts/deploy
```

#### Get Contract Facets
```http
GET /api/contracts/facets
```

#### Get Contract Events
```http
GET /api/contracts/events?contractAddress=0.0.12345&eventType=ConsentGranted&limit=50
```

## 🎨 Frontend

### Project Structure
```
frontend/src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── patient/         # Patient-specific components
│   ├── provider/        # Provider-specific components
│   ├── billing/         # Billing components
│   ├── consent/         # Consent management
│   ├── insurance/       # Insurance components
│   └── hooks/           # Custom React hooks
├── types/               # TypeScript definitions
├── utils/               # Utility functions
├── App.tsx              # Main application component
└── index.tsx            # Application entry point
```

### Key Components

#### PatientDashboard
- **Purpose**: Patient's main interface
- **Features**: Consent management, invoice viewing, claim tracking
- **State Management**: Redux for global state

#### ProviderDashboard
- **Purpose**: Healthcare provider interface
- **Features**: Patient management, invoice creation, analytics
- **Components**: PatientManager, InvoiceManager, ClaimManager

#### ConsentManager
- **Purpose**: Handle patient consent workflows
- **Features**: Consent requests, approval/denial, scope management

#### BillingManager
- **Purpose**: Invoice creation and management
- **Features**: Line item management, CPT/ICD code lookup, payment processing

### Styling Guidelines

#### Color Palette
```css
/* Primary Colors */
--primary-teal: #00CEC8;
--primary-green: #4CAF50;

/* Neutral Colors */
--neutral-white: #FFFFFF;
--neutral-lightGray: #F8F9FA;
--neutral-mediumGray: #6C757D;
--neutral-darkGray: #343A40;

/* Status Colors */
--status-success: #28A745;
--status-warning: #FFC107;
--status-danger: #DC3545;
--status-info: #17A2B8;
```

#### Component Classes
```css
/* Healthcare-specific utility classes */
.healthcare-button-primary    /* Primary action buttons */
.healthcare-button-secondary  /* Secondary action buttons */
.healthcare-card             /* Card containers */
.healthcare-input            /* Form inputs */
.healthcare-container        /* Page containers */
```

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Foundry**: Latest version for smart contract development
- **Git**: For version control

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/afrihealth/ledger.git
cd afrihealth-ledger
```

#### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm run install:all

# Or install individually
cd backend && pnpm install
cd frontend && pnpm install
cd contracts && forge install
```

#### 3. Environment Configuration

**Backend Environment** (`.env`)
```bash
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/afrihealth

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Hedera Network Configuration
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet

# Contract Addresses (after deployment)
DIAMOND_CONTRACT_ADDRESS=0.0.CONTRACT_ADDRESS
PLATFORM_CREDIT_TOKEN_ADDRESS=0.0.TOKEN_ADDRESS
INSURANCE_POOL_TOKEN_ADDRESS=0.0.TOKEN_ADDRESS
REPUTATION_NFT_ADDRESS=0.0.NFT_ADDRESS

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Frontend Environment** (`.env.local`)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_HEDERA_NETWORK=testnet
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

#### 4. Database Setup
```bash
# Create PostgreSQL database
createdb afrihealth

# Run migrations (when implemented)
pnpm run db:migrate
```

#### 5. Smart Contract Deployment
```bash
cd contracts

# Build contracts
forge build

# Run tests
forge test

# Deploy to testnet
forge script script/DeployAfriHealth.s.sol --rpc-url testnet --broadcast --verify

# Update backend .env with deployed contract addresses
```

### Development Servers

#### Start Backend
```bash
cd backend
pnpm run dev
# Server runs on http://localhost:3001
```

#### Start Frontend
```bash
cd frontend
pnpm start
# Application runs on http://localhost:3000
```

#### Start Both (Development)
```bash
# Terminal 1 - Backend
cd backend && pnpm run dev

# Terminal 2 - Frontend
cd frontend && pnpm start
```

## 🔄 Development Workflow

### Code Organization

#### Git Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New feature development
- `hotfix/*`: Urgent bug fixes
- `release/*`: Release preparation

#### Commit Convention
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: frontend, backend, contracts, docs, config
```

### Development Process

#### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-patient-consent-flow

# Develop feature with tests
# Update documentation

# Create pull request to develop
```

#### 2. Smart Contract Development
```bash
cd contracts

# Write contract
# Add tests
forge test

# Update interface documentation
# Deploy to testnet for testing
```

#### 3. Backend Development
```bash
cd backend

# Add API endpoints
# Add validation
# Add error handling
pnpm run type-check

# Test with frontend
```

#### 4. Frontend Development
```bash
cd frontend

# Implement UI components
# Add state management
pnpm run lint

# Test responsive design
```

## 🚢 Deployment

### Staging Deployment
```bash
# Deploy contracts to testnet
cd contracts && forge script script/DeployAfriHealth.s.sol --rpc-url testnet --broadcast

# Update backend environment
# Deploy backend to staging server
# Deploy frontend to staging environment

# Run integration tests
```

### Production Deployment
```bash
# Deploy contracts to mainnet
cd contracts && forge script script/DeployAfriHealth.s.sol --rpc-url mainnet --broadcast

# Update production environment variables
# Deploy backend to production
# Deploy frontend to production

# Update DNS and CDN configurations
```

### Monitoring & Maintenance

#### Health Checks
- **Backend Health**: `GET /health`
- **Contract Status**: `GET /api/contracts/info`
- **Database Status**: Database connection monitoring

#### Logging
- **Application Logs**: Winston logger with multiple transports
- **Contract Events**: Hedera Consensus Service topics
- **Error Tracking**: Sentry integration (planned)

## 🧪 Testing

### Testing Strategy

#### Unit Tests
```bash
# Backend unit tests
cd backend && pnpm run test

# Frontend unit tests
cd frontend && pnpm run test

# Smart contract tests
cd contracts && forge test
```

#### Integration Tests
```bash
# API integration tests
cd backend && pnpm run test:integration

# End-to-end tests
pnpm run test:e2e
```

#### Performance Tests
```bash
# Load testing
pnpm run test:load

# Contract gas optimization
cd contracts && forge test --gas-report
```

### Test Coverage Requirements
- **Backend**: >80% code coverage
- **Frontend**: >70% code coverage
- **Smart Contracts**: >90% code coverage

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

### Code Standards

#### TypeScript Guidelines
- Use strict mode
- Prefer interfaces over types
- Use meaningful variable names
- Add JSDoc comments for public APIs

#### Solidity Guidelines
- Follow Solidity Style Guide
- Use latest compiler version
- Implement proper access control
- Add comprehensive NatSpec documentation

#### React Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for all components
- Follow accessibility best practices

### Pull Request Process
1. **Create PR**: Clear title and description
2. **Code Review**: Address reviewer feedback
3. **Testing**: All tests pass
4. **Documentation**: Update relevant docs
5. **Approval**: Two approvals required
6. **Merge**: Squash and merge to main

## 📞 Support & Communication

### Development Channels
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time development discussions
- **Email**: development@afrihealth.io

### Documentation Updates
- **API Documentation**: Auto-generated from code comments
- **Architecture Decisions**: Documented in ADR format
- **Deployment Guides**: Updated with each release

---

## 📄 Additional Resources

- [Hedera Developer Documentation](https://docs.hedera.com/)
- [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainers**: AfriHealth Ledger Development Team
