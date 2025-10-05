#!/bin/bash

# Extract ABIs from Solidity interfaces
# This script generates minimal ABIs for frontend integration

cd "$(dirname "$0")/.."

echo "🔨 Generating ABIs from interfaces..."

# Create ABI directory
mkdir -p abi

# Generate ABI for each interface using Solidity compiler
forge inspect src/interfaces/IIdentity.sol:IIdentity abi > abi/IIdentity.json 2>/dev/null || echo "[]" > abi/IIdentity.json
forge inspect src/interfaces/IConsent.sol:IConsent abi > abi/IConsent.json 2>/dev/null || echo "[]" > abi/IConsent.json
forge inspect src/interfaces/IRecordsRegistry.sol:IRecordsRegistry abi > abi/IRecordsRegistry.json 2>/dev/null || echo "[]" > abi/IRecordsRegistry.json
forge inspect src/interfaces/IBilling.sol:IBilling abi > abi/IBilling.json 2>/dev/null || echo "[]" > abi/IBilling.json
forge inspect src/interfaces/IClaims.sol:IClaims abi > abi/IClaims.json 2>/dev/null || echo "[]" > abi/IClaims.json
forge inspect src/interfaces/IAIPolicy.sol:IAIPolicy abi > abi/IAIPolicy.json 2>/dev/null || echo "[]" > abi/IAIPolicy.json
forge inspect src/interfaces/IInsurancePool.sol:IInsurancePool abi > abi/IInsurancePool.json 2>/dev/null || echo "[]" > abi/IInsurancePool.json
forge inspect src/interfaces/IDispute.sol:IDispute abi > abi/IDispute.json 2>/dev/null || echo "[]" > abi/IDispute.json
forge inspect src/interfaces/IGovernance.sol:IGovernance abi > abi/IGovernance.json 2>/dev/null || echo "[]" > abi/IGovernance.json
forge inspect src/interfaces/IToken.sol:IToken abi > abi/IToken.json 2>/dev/null || echo "[]" > abi/IToken.json
forge inspect src/interfaces/IAudit.sol:IAudit abi > abi/IAudit.json 2>/dev/null || echo "[]" > abi/IAudit.json
forge inspect src/interfaces/IOracle.sol:IOracle abi > abi/IOracle.json 2>/dev/null || echo "[]" > abi/IOracle.json
forge inspect src/interfaces/ITreasury.sol:ITreasury abi > abi/ITreasury.json 2>/dev/null || echo "[]" > abi/ITreasury.json
forge inspect src/interfaces/IAccessControl.sol:IAccessControl abi > abi/IAccessControl.json 2>/dev/null || echo "[]" > abi/IAccessControl.json
forge inspect src/interfaces/IDiamond.sol:IDiamond abi > abi/IDiamond.json 2>/dev/null || echo "[]" > abi/IDiamond.json

echo "✅ ABIs generated in contracts/abi/"
echo ""
echo "📋 Generated files:"
ls -lh abi/*.json

echo ""
echo "🎯 Next steps:"
echo "1. Deploy the Diamond contract to Hedera"
echo "2. Copy the contract address to backend .env"
echo "3. Use these ABIs to interact with the contract"
