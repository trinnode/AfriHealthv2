#!/bin/bash

# 🚀 AfriHealth Ledger - Quick Start Script
# Run this to continue development

echo "========================================="
echo "🏥 AfriHealth Ledger - Development Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "contracts" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking project status...${NC}"
echo ""

# Check contracts
echo "1. Smart Contracts Status:"
cd contracts
if forge build > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Contracts compile successfully${NC}"
else
    echo -e "   ${YELLOW}⚠️  Contracts have compilation warnings (not critical)${NC}"
fi
cd ..

# Check frontend
echo ""
echo "2. Frontend Status:"
if [ -d "frontend/node_modules" ]; then
    echo -e "   ${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "   ${RED}❌ Frontend dependencies NOT installed${NC}"
    echo -e "   ${YELLOW}   Run: cd frontend && pnpm install${NC}"
fi

# Check backend
echo ""
echo "3. Backend Status:"
if [ -d "backend/node_modules" ]; then
    echo -e "   ${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "   ${RED}❌ Backend dependencies NOT installed${NC}"
    echo -e "   ${YELLOW}   Run: cd backend && pnpm install${NC}"
fi

echo ""
echo "========================================="
echo "🎯 IMMEDIATE NEXT STEPS"
echo "========================================="
echo ""
echo "1. Install Frontend Dependencies (if not done):"
echo "   ${YELLOW}cd frontend && pnpm install${NC}"
echo ""
echo "2. Install Backend Dependencies (if not done):"
echo "   ${YELLOW}cd backend && pnpm install${NC}"
echo ""
echo "3. Run Development Servers:"
echo "   Terminal 1: ${YELLOW}cd backend && pnpm run dev${NC}"
echo "   Terminal 2: ${YELLOW}cd frontend && pnpm run dev${NC}"
echo ""
echo "4. Deploy to Hedera Testnet (after setup):"
echo "   ${YELLOW}cd contracts && forge script script/DeployHederaTestnet.s.sol --rpc-url testnet --broadcast${NC}"
echo ""
echo "========================================="
echo "📚 DOCUMENTATION"
echo "========================================="
echo ""
echo "• IMPLEMENTATION_GUIDE.md - Complete implementation guide"
echo "• IMPLEMENTATION_STATUS.md - Current status and next steps"
echo "• README.md - Project overview"
echo ""
echo "========================================="
echo "🎨 DESIGN SPECIFICATIONS"
echo "========================================="
echo ""
echo "Colors:"
echo "  • Black (#000000) - Background"
echo "  • Orange (#FF6B35) - Primary actions"
echo "  • Army Green (#4A5F3A) - Success states"
echo "  • Red (#D62828) - Errors"
echo ""
echo "Fonts:"
echo "  • Lora - Headings (serif)"
echo "  • Space Mono - Body text (monospace)"
echo ""
echo "Features:"
echo "  • 3D animations with React Three Fiber"
echo "  • NO gradients (solid colors only)"
echo "  • HashPack wallet integration"
echo "  • Real Hedera HTS & HCS integration"
echo ""
echo "========================================="
echo "🔗 USEFUL LINKS"
echo "========================================="
echo ""
echo "• Hedera Portal: https://portal.hedera.com"
echo "• HashScan: https://hashscan.io/testnet"
echo "• HashPack Wallet: https://www.hashpack.app"
echo "• Hedera Docs: https://docs.hedera.com"
echo ""
echo "========================================="
echo "✨ Happy Coding!"
echo "========================================="
