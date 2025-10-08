#!/bin/bash

# Hedera Testnet Contract Verification Script
# This script verifies all deployed contracts on HashScan

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
source .env

# Contract addresses from deployment
DIAMOND="0xC3b66a49c838e5472034169D4621Fe8Aad699A49"
DIAMOND_CUT_FACET="0xCc01cd63586b170651795EB720EAdfc4fea8ef42"
DIAMOND_LOUPE_FACET="0xB5D9A06851fC9191b2930a1e19923d4647cF2342"
ACCESS_CONTROL_FACET="0x4b81E7CB8cfE057B299C869995f4A6Ca977b9441"
CONSENT_FACET="0xbDaBE1898d24b0572ABFcac9c9C38fdaF93a6089"
TOKEN_FACET="0xA5D639d3E9a30Cb3e5e2Be55b3f635757545dE5f"
BILLING_FACET="0xe27D52fa076e0221945bBa070bE32314a9FAC86f"
CLAIMS_FACET="0x9508b921C26490d63223AA0486C02979D2E68780"
INSURANCE_POOL_FACET="0x4c9c785647be0615E4989a11A3A78DC6395A9f05"
IDENTITY_FACET="0x807cA7d2BB9523970DeB2f9705D19651634fDC9D"
RECORDS_REGISTRY_FACET="0x22C23D4fe94A49642A7304b3a898F670dC03CC48"

# Deployer address (must match the address used in deployment)
DEPLOYER_ADDRESS=$(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY)

echo "==========================================="
echo "AfriHealth - Hedera Testnet Verification"
echo "==========================================="
echo "Chain ID: 296"
echo "Deployer: $DEPLOYER_ADDRESS"
echo ""

# Check if HEDERA_API_KEY is set
if [ -z "$HEDERA_API_KEY" ]; then
    echo -e "${RED}Error: HEDERA_API_KEY not set in .env${NC}"
    echo "Get your API key from: https://hashscan.io/api-keys"
    exit 1
fi

echo "Verifying contracts..."
echo ""

# Function to verify contract with Forge
verify_contract() {
    local CONTRACT_ADDRESS=$1
    local CONTRACT_PATH=$2
    local CONTRACT_NAME=$3
    local CONSTRUCTOR_ARGS=$4
    
    echo -e "${YELLOW}Verifying $CONTRACT_NAME...${NC}"
    
    if [ -z "$CONSTRUCTOR_ARGS" ]; then
        forge verify-contract \
            --chain-id 296 \
            --num-of-optimizations 200 \
            --watch \
            --compiler-version v0.8.20+commit.a1b79de6 \
            --verifier-url https://server-verify.hashscan.io \
            $CONTRACT_ADDRESS \
            $CONTRACT_PATH \
            --etherscan-api-key $HEDERA_API_KEY
    else
        forge verify-contract \
            --chain-id 296 \
            --num-of-optimizations 200 \
            --watch \
            --compiler-version v0.8.20+commit.a1b79de6 \
            --constructor-args $CONSTRUCTOR_ARGS \
            --verifier-url https://server-verify.hashscan.io \
            $CONTRACT_ADDRESS \
            $CONTRACT_PATH \
            --etherscan-api-key $HEDERA_API_KEY
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $CONTRACT_NAME verified successfully${NC}"
    else
        echo -e "${RED}✗ $CONTRACT_NAME verification failed${NC}"
    fi
    echo ""
    sleep 2 # Rate limiting
}

# Verify DiamondCutFacet (no constructor args)
verify_contract \
    "$DIAMOND_CUT_FACET" \
    "src/facets/DiamondCutFacet.sol:DiamondCutFacet" \
    "DiamondCutFacet" \
    ""

# Generate constructor args for Diamond (owner, diamondCutFacet)
DIAMOND_CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,address)" $DEPLOYER_ADDRESS $DIAMOND_CUT_FACET)

# Verify Diamond
verify_contract \
    "$DIAMOND" \
    "src/Diamond.sol:Diamond" \
    "Diamond" \
    "$DIAMOND_CONSTRUCTOR_ARGS"

# Verify DiamondLoupeFacet
verify_contract \
    "$DIAMOND_LOUPE_FACET" \
    "src/facets/DiamondLoupeFacet.sol:DiamondLoupeFacet" \
    "DiamondLoupeFacet" \
    ""

# Verify AccessControlFacet
verify_contract \
    "$ACCESS_CONTROL_FACET" \
    "src/facets/AccessControlFacet.sol:AccessControlFacet" \
    "AccessControlFacet" \
    ""

# Verify ConsentFacet
verify_contract \
    "$CONSENT_FACET" \
    "src/facets/ConsentFacet.sol:ConsentFacet" \
    "ConsentFacet" \
    ""

# Verify TokenFacet
verify_contract \
    "$TOKEN_FACET" \
    "src/facets/TokenFacet.sol:TokenFacet" \
    "TokenFacet" \
    ""

# Verify BillingFacet
verify_contract \
    "$BILLING_FACET" \
    "src/facets/BillingFacet.sol:BillingFacet" \
    "BillingFacet" \
    ""

# Verify ClaimsFacet
verify_contract \
    "$CLAIMS_FACET" \
    "src/facets/ClaimsFacet.sol:ClaimsFacet" \
    "ClaimsFacet" \
    ""

# Verify InsurancePoolFacet
verify_contract \
    "$INSURANCE_POOL_FACET" \
    "src/facets/InsurancePoolFacet.sol:InsurancePoolFacet" \
    "InsurancePoolFacet" \
    ""

# Verify IdentityFacet
verify_contract \
    "$IDENTITY_FACET" \
    "src/facets/IdentityFacet.sol:IdentityFacet" \
    "IdentityFacet" \
    ""

# Verify RecordsRegistryFacet
verify_contract \
    "$RECORDS_REGISTRY_FACET" \
    "src/facets/RecordsRegistryFacet.sol:RecordsRegistryFacet" \
    "RecordsRegistryFacet" \
    ""

echo ""
echo "==========================================="
echo "Verification Complete!"
echo "==========================================="
echo ""
echo "View verified contracts on HashScan:"
echo "Diamond: https://hashscan.io/testnet/contract/$DIAMOND"
echo ""
echo "All facets can be viewed through the Diamond proxy"
echo "==========================================="