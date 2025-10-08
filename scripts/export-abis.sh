#!/bin/bash

# Export Contract ABIs for Frontend
# This script extracts ABIs from Foundry build artifacts

set -e

CONTRACTS_DIR="contracts/out"
ABI_DIR="frontend/src/contracts/abis"
TYPES_DIR="frontend/src/contracts/types"

echo "🔨 Exporting Contract ABIs..."

# Create directories
mkdir -p "$ABI_DIR"
mkdir -p "$TYPES_DIR"

# List of facets to export
FACETS=(
    "Diamond"
    "DiamondCutFacet"
    "DiamondLoupeFacet"
    "AccessControlFacet"
    "IdentityFacet"
    "ConsentFacet"
    "RecordsRegistryFacet"
    "BillingFacet"
    "ClaimsFacet"
    "AIPolicyFacet"
    "InsurancePoolFacet"
    "OracleFacet"
    "AuditFacet"
    "GovernanceFacet"
    "DisputeFacet"
    "TokenFacet"
    "TreasuryFacet"
)

# Extract ABIs
for facet in "${FACETS[@]}"; do
    SOURCE="${CONTRACTS_DIR}/${facet}.sol/${facet}.json"
    DEST="${ABI_DIR}/${facet}.json"
    
    if [ -f "$SOURCE" ]; then
        echo "  ✓ Extracting ${facet} ABI..."
        jq '.abi' "$SOURCE" > "$DEST"
    else
        echo "  ⚠ Warning: ${facet} not found at ${SOURCE}"
    fi
done

echo "✅ ABIs exported to ${ABI_DIR}"
echo ""
echo "📦 Generating TypeScript types..."

# Create index file for easy imports
cat > "${ABI_DIR}/index.ts" << 'EOF'
// Auto-generated ABI exports
// Do not edit manually

import DiamondABI from './Diamond.json';
import DiamondCutFacetABI from './DiamondCutFacet.json';
import DiamondLoupeFacetABI from './DiamondLoupeFacet.json';
import AccessControlFacetABI from './AccessControlFacet.json';
import IdentityFacetABI from './IdentityFacet.json';
import ConsentFacetABI from './ConsentFacet.json';
import RecordsRegistryFacetABI from './RecordsRegistryFacet.json';
import BillingFacetABI from './BillingFacet.json';
import ClaimsFacetABI from './ClaimsFacet.json';
import AIPolicyFacetABI from './AIPolicyFacet.json';
import InsurancePoolFacetABI from './InsurancePoolFacet.json';
import OracleFacetABI from './OracleFacet.json';
import AuditFacetABI from './AuditFacet.json';
import GovernanceFacetABI from './GovernanceFacet.json';
import DisputeFacetABI from './DisputeFacet.json';
import TokenFacetABI from './TokenFacet.json';
import TreasuryFacetABI from './TreasuryFacet.json';

export {
  DiamondABI,
  DiamondCutFacetABI,
  DiamondLoupeFacetABI,
  AccessControlFacetABI,
  IdentityFacetABI,
  ConsentFacetABI,
  RecordsRegistryFacetABI,
  BillingFacetABI,
  ClaimsFacetABI,
  AIPolicyFacetABI,
  InsurancePoolFacetABI,
  OracleFacetABI,
  AuditFacetABI,
  GovernanceFacetABI,
  DisputeFacetABI,
  TokenFacetABI,
  TreasuryFacetABI,
};

// Facet addresses will be set after deployment
export const FACET_ADDRESSES = {
  diamond: process.env.REACT_APP_DIAMOND_ADDRESS || '',
  diamondCut: '',
  diamondLoupe: '',
  accessControl: '',
  identity: '',
  consent: '',
  recordsRegistry: '',
  billing: '',
  claims: '',
  aiPolicy: '',
  insurancePool: '',
  oracle: '',
  audit: '',
  governance: '',
  dispute: '',
  token: '',
  treasury: '',
};
EOF

echo "✅ TypeScript index created"
echo ""
echo "🎉 Done! ABIs are ready for frontend integration"
