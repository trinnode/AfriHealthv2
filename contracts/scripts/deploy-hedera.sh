#!/bin/bash

# AfriHealth Ledger - Hedera Testnet Deployment Script
# This script deploys the Diamond proxy and all facets to Hedera Testnet

set -e  # Exit on any error

echo "=================================================="
echo "AfriHealth Ledger - Hedera Testnet Deployment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo ""
    echo "Please create a .env file with the following variables:"
    echo "  HEDERA_TESTNET_RPC=https://testnet.hashio.io/api"
    echo "  DEPLOYER_PRIVATE_KEY=your_private_key_here"
    echo "  HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID"
    echo ""
    exit 1
fi

# Load environment variables
echo -e "${YELLOW}Loading environment variables...${NC}"
source .env

# Verify required variables
if [ -z "$HEDERA_TESTNET_RPC" ]; then
    echo -e "${RED}Error: HEDERA_TESTNET_RPC not set in .env${NC}"
    exit 1
fi

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo -e "${RED}Error: DEPLOYER_PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"
echo ""
echo "Network: Hedera Testnet"
echo "RPC URL: $HEDERA_TESTNET_RPC"
echo ""

# Check forge is installed
if ! command -v forge &> /dev/null; then
    echo -e "${RED}Error: Foundry (forge) is not installed${NC}"
    echo "Please install Foundry: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi

echo -e "${GREEN}✓ Foundry is installed${NC}"
echo ""

# Create deployments directory if it doesn't exist
mkdir -p deployments

# Run the deployment
echo -e "${YELLOW}Starting deployment...${NC}"
echo ""

forge script script/DeployHederaTestnet.s.sol:DeployHederaTestnet \
  --rpc-url $HEDERA_TESTNET_RPC \
  --broadcast \
  -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}=================================================="
    echo "Deployment Successful!"
    echo "==================================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check deployment addresses in: deployments/hedera-testnet.json"
    echo "2. Verify contracts on HashScan: https://hashscan.io/testnet"
    echo "3. Update backend/.env with the Diamond contract address"
    echo "4. Test contract functions"
    echo ""
else
    echo ""
    echo -e "${RED}=================================================="
    echo "Deployment Failed!"
    echo "==================================================${NC}"
    echo ""
    echo "Please check the error messages above."
    echo "Common issues:"
    echo "  - Insufficient HBAR balance (get testnet HBAR from faucet)"
    echo "  - Invalid private key"
    echo "  - RPC connection issues"
    echo ""
    exit 1
fi
