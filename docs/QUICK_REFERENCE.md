# 🚀 AfriHealth Ledger - Quick Reference Card

## 📁 Project Structure
```
afrihealth-ledger/
├── contracts/          # Smart contracts (Foundry)
├── frontend/           # React + 3D UI (Vite)
├── backend/            # Express API (Node.js)
├── docs/               # Documentation
└── scripts/            # Deployment scripts
```

## ⚡ Quick Commands

### Contracts
```bash
cd contracts
forge build                  # Compile
forge test                   # Run tests
forge test -vvv              # Verbose tests
```

### Frontend
```bash
cd frontend
pnpm run dev                  # Start dev server (port 5173)
pnpm run build                # Build for production
```

### Backend
```bash
cd backend
pnpm run dev                  # Start dev server (port 3001)
pnpm run build                # Compile TypeScript
```

## 🎨 Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Black | `#000000` | Background |
| Orange | `#FF6B35` | Primary actions |
| Army Green | `#4A5F3A` | Success |
| Red | `#D62828` | Errors |

### Fonts
- **Lora** - Headings (serif)
- **Space Mono** - Body (monospace)

### Rules
- ❌ NO gradients
- ✅ Solid colors only
- ✅ High contrast
- ✅ 3D elements

## 🔧 Key Files

### Smart Contracts
- `contracts/src/facets/TokenFacetHTS.sol` - HTS integration
- `contracts/src/facets/ConsentFacetHCS.sol` - HCS messages
- `contracts/foundry.toml` - Build configuration

### Frontend
- `frontend/src/App.tsx` - Main app
- `frontend/tailwind.config.js` - Theme
- `frontend/src/index.css` - Global styles

### Backend
- `backend/src/server.ts` - Entry point
- `backend/src/services/hederaService.ts` - Hedera SDK
- `backend/.env` - Environment variables

## 📚 Documentation
- `PROJECT_SUMMARY.md` - This file
- `IMPLEMENTATION_GUIDE.md` - Step-by-step guide
- `IMPLEMENTATION_STATUS.md` - Current status
- `AfriHealth Ledger Yellow Paper (v1.0).md` - Full spec

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   cd backend && pnpm install
   # Frontend deps already installed
   ```

2. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit with your Hedera credentials
   ```

3. **Run Dev Servers**
   ```bash
   # Terminal 1
   cd backend && pnpm run dev
   
   # Terminal 2
   cd frontend && pnpm run dev
   ```

4. **Open Browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🔑 Environment Variables

### Backend (.env)
```bash
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_PRIVATE_KEY
HEDERA_NETWORK=testnet
DIAMOND_CONTRACT_ADDRESS=0.0.CONTRACT
```

## 🎯 Current Status

| Component | Status | Completion |
|-----------|--------|------------|
| Contracts | 🟡 In Progress | 70% |
| Frontend | 🟡 In Progress | 40% |
| Backend | 🟡 In Progress | 35% |
| Docs | 🟢 Complete | 80% |

## ⚠️ Known Issues
- Backend deps need installation
- Minor contract compilation warnings (not critical)
- Frontend needs wallet integration
- Dashboard UIs need completion

## 🎯 Next Steps

### Priority 1 (Critical)
- [ ] Install backend dependencies
- [ ] Implement HashConnect wallet
- [ ] Create HCS service in backend

### Priority 2 (High)
- [ ] Build Patient Dashboard UI
- [ ] Build Provider Dashboard UI
- [ ] Deploy contracts to testnet

### Priority 3 (Medium)
- [ ] Add 3D components
- [ ] Write tests
- [ ] Update documentation

## 🔗 Useful Links
- Hedera Portal: https://portal.hedera.com
- HashScan (Testnet): https://hashscan.io/testnet
- HashPack Wallet: https://www.hashpack.app
- Hedera Docs: https://docs.hedera.com

## 💡 Tips

### Debugging
```bash
# Check contract compilation
cd contracts && forge build 2>&1 | less

# Check backend status
cd backend && pnpm run dev

# Check frontend status
cd frontend && pnpm run dev
```

### Common Issues
1. **pnpm install fails**: Use ``
2. **Contract won't compile**: Check import paths
3. **Wallet won't connect**: Check network (testnet/mainnet)

## 📞 Support
- Review `IMPLEMENTATION_GUIDE.md` for detailed instructions
- Check `IMPLEMENTATION_STATUS.md` for current progress
- Run `./start-dev.sh` for project status

---

**Last Updated:** October 4, 2025  
**Version:** 1.0.0  
**Status:** Foundation Complete ✅
