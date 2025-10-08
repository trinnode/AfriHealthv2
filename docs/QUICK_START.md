# 🚀 AfriHealth Ledger - Quick Start Guide

## ✅ Prerequisites

- Node.js 18+ and npm
- Hedera Testnet Account (free at [portal.hedera.com](https://portal.hedera.com))
- Git

## 📦 Installation

### 1. Clone the Repository

```bash
cd /home/trinnex/Developments/Hedera
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install contract dependencies (optional - ABIs already generated)
cd ../contracts
forge install
```

## 🔑 Configuration

### 1. Get Hedera Testnet Account

1. Go to [https://portal.hedera.com](https://portal.hedera.com)
2. Create a free testnet account
3. Copy your **Account ID** (format: `0.0.12345`)
4. Copy your **Private Key** (starts with `302e...`)

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```bash
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
DIAMOND_CONTRACT_ADDRESS=0.0.CONTRACT_ID  # Set after deployment
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_HEDERA_NETWORK=testnet
```

## 🏗️ Contract Deployment

### Option 1: Use Existing ABIs (Recommended for Testing)

The ABIs are already generated in `contracts/abi/`. You just need to deploy the diamond contract and get the address.

```bash
cd contracts

# Compile contracts (optional - already done)
forge build

# Deploy to Hedera testnet (you'll do this manually later)
# For now, use a placeholder address in .env
```

**Temporary Setup:**
Set `DIAMOND_CONTRACT_ADDRESS=0.0.12345` in `backend/.env` (use any testnet contract ID for testing)

### Option 2: Full Deployment (Coming Soon)

We'll create a deployment script once you're ready to deploy to testnet.

## 🚀 Running the Application

### Terminal 1: Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
═══════════════════════════════════════════════
🏥 AfriHealth Ledger API Server
═══════════════════════════════════════════════
🚀 Server running on port 3001
📊 Health check: http://localhost:3001/health
📚 API endpoints: http://localhost:3001/api
✅ Hedera service initialized successfully
✨ Server ready!
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v7.1.9  ready in 1617 ms
➜  Local:   http://localhost:5173/
```

## 🧪 Testing the API

### 1. Health Check

```bash
curl http://localhost:3001/health
```

### 2. API Endpoints

```bash
curl http://localhost:3001/api
```

### 3. Test Identity Registration

```bash
curl -X POST http://localhost:3001/api/identity/register \
  -H "Content-Type: application/json" \
  -d '{
    "identityType": 0,
    "licenseNumber": "",
    "specialization": ""
  }'
```

## 📚 API Documentation

### Available Endpoints

#### Identity Management
- `POST /api/identity/register` - Register new identity
- `GET /api/identity/:address` - Get identity info
- `POST /api/identity/verify` - Verify identity (admin)

#### Consent Management
- `POST /api/consent/grant` - Grant consent
- `POST /api/consent/revoke` - Revoke consent
- `GET /api/consent/patient/:address` - Get patient consents
- `GET /api/consent/:id` - Get consent details

#### Medical Records
- `POST /api/records/create` - Create medical record
- `GET /api/records/patient/:address` - Get patient records
- `GET /api/records/:id` - Get record details
- `PUT /api/records/:id/metadata` - Update record metadata

#### Billing
- `POST /api/billing/invoice/create` - Create invoice
- `POST /api/billing/invoice/pay` - Pay invoice
- `GET /api/billing/invoice/:id` - Get invoice
- `GET /api/billing/patient/:address/invoices` - Get patient invoices
- `GET /api/billing/provider/:address/invoices` - Get provider invoices

#### Claims
- `POST /api/claims/submit` - Submit insurance claim
- `POST /api/claims/process` - Process claim (insurer)
- `GET /api/claims/:id` - Get claim details
- `GET /api/claims/user/:address` - Get user claims

#### AI Policy
- `POST /api/ai-policy/create` - Create AI policy
- `POST /api/ai-policy/assign` - Assign policy to patient
- `GET /api/ai-policy/:id` - Get policy details
- `GET /api/ai-policy/patient/:address` - Get patient's policy
- `POST /api/ai-policy/evaluate` - Evaluate invoice with AI

#### Insurance Pool
- `POST /api/insurance-pool/create` - Create insurance pool
- `POST /api/insurance-pool/contribute` - Contribute to pool
- `GET /api/insurance-pool/:id` - Get pool details
- `GET /api/insurance-pool/:id/membership/:address` - Get membership

#### Dispute Resolution
- `POST /api/dispute/create` - Create dispute
- `POST /api/dispute/resolve` - Resolve dispute (admin)
- `GET /api/dispute/:id` - Get dispute details

#### Governance
- `POST /api/governance/proposal/create` - Create proposal
- `POST /api/governance/proposal/vote` - Vote on proposal
- `GET /api/governance/proposal/:id` - Get proposal details

#### Audit
- `GET /api/audit/access-logs/:address` - Get access logs
- `GET /api/audit/log/:id` - Get audit log details

## 🎯 Next Steps

### Phase 1: Connect Frontend to Backend ✅

We've just completed:
- ✅ Backend API with all endpoints
- ✅ Contract service layer
- ✅ Route handlers for all features
- ✅ ABI files generated

Next: **Connect frontend components to real API**

### Phase 2: Remove Mock Data (In Progress)

We'll update each dashboard component to:
1. Call real API endpoints
2. Handle loading states
3. Show real data from blockchain
4. Handle errors gracefully

### Phase 3: Add Real-Time Features

- WebSocket for live updates
- Push notifications
- Background workers

### Phase 4: AI Integration

- ML model for invoice evaluation
- Policy rule engine
- Automated approvals

## 🐛 Troubleshooting

### Backend won't start

**Error:** "HEDERA_ACCOUNT_ID not configured"

**Solution:** Set your Hedera credentials in `backend/.env`

### Frontend can't connect to backend

**Error:** "Network Error" or CORS error

**Solution:** 
1. Make sure backend is running on port 3001
2. Check `FRONTEND_URL=http://localhost:5173` in `backend/.env`
3. Check `REACT_APP_API_URL=http://localhost:3001` in `frontend/.env`

### Contract calls failing

**Error:** "Contract not initialized"

**Solution:** Set `DIAMOND_CONTRACT_ADDRESS` in `backend/.env` (use a test address for now)

## 📖 Development Workflow

1. **Make changes** to backend routes or frontend components
2. **Test locally** with curl or frontend
3. **Check logs** in terminal for errors
4. **Iterate** quickly - both servers have hot reload

## 🎨 Current Status

✅ **Backend:** Fully implemented (14 endpoints, ~2,000 lines)
✅ **ABIs:** Generated for all 14 contract facets
✅ **Frontend UI:** Beautiful dashboards (60% complete)
⚠️ **Integration:** Just starting! (5% complete)

**Next:** Connect PatientDashboard to real API endpoints!

## 📞 Support

Having issues? Check:
1. Console logs in browser (F12)
2. Backend terminal output
3. Network tab in browser dev tools
4. `backend/logs/` directory

## 🎉 Success Indicators

You're ready when you see:
- ✅ Backend server running on port 3001
- ✅ Frontend running on port 5173
- ✅ "Hedera service initialized" in backend logs
- ✅ No errors in browser console
- ✅ API health check returns OK

**Time to remove the mock data and go live!** 🚀
