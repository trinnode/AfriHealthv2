# Hedera Testnet Deployment Guide

This guide will walk you through deploying the AfriHealth Diamond contract to Hedera Testnet.

## Prerequisites

### 1. Create a Hedera Testnet Account
- Go to [Hedera Portal](https://portal.hedera.com/)
- Create a testnet account
- Fund it with testnet HBAR from the faucet: https://portal.hedera.com/faucet

### 2. Get Your Private Key
- Export your private key from your Hedera wallet (MetaMask, HashPack, Blade, etc.)
- **IMPORTANT**: This should be a testnet account only, never use mainnet keys

### 3. Set Up Environment Variables

Create a `.env` file in the `contracts` directory:

```bash
# Hedera Testnet Configuration
HEDERA_TESTNET_RPC=https://testnet.hashio.io/api
DEPLOYER_PRIVATE_KEY=your_private_key_here_without_0x_prefix
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT_ID

# Optional: For contract verification
HEDERA_API_KEY=your_hashscan_api_key_if_available
```

**Important Notes:**
- The RPC URL `https://testnet.hashio.io/api` is the official Hedera JSON-RPC Relay
- Your private key should be in hex format without the `0x` prefix
- Your account ID is in the format `0.0.12345678`

## Deployment Steps

### Option 1: Using the Deployment Script (Recommended)

```bash
# From the contracts directory
cd /home/trinnex/Developments/Hedera/contracts

# Make the script executable
chmod +x scripts/deploy-hedera.sh

# Run the deployment
./scripts/deploy-hedera.sh
```

### Option 2: Manual Deployment

```bash
# Load environment variables
source .env

# Deploy to Hedera Testnet
forge script script/DeployHederaTestnet.s.sol:DeployHederaTestnet \
  --rpc-url $HEDERA_TESTNET_RPC \
  --broadcast \
  --verify \
  -vvvv
```

## Post-Deployment Steps

### 1. Save Deployment Addresses
After successful deployment, addresses will be saved to:
```
contracts/deployments/hedera-testnet.json
```

### 2. Update Backend Configuration
Copy the Diamond proxy address and update your backend `.env`:

```bash
# In backend/.env
DIAMOND_CONTRACT_ADDRESS=0x...YourDiamondAddress...
HEDERA_NETWORK=testnet
HEDERA_TESTNET_RPC=https://testnet.hashio.io/api
```

### 3. Verify Contracts on HashScan
Visit HashScan to verify your deployment:
```
https://hashscan.io/testnet/contract/YOUR_DIAMOND_ADDRESS
```

### 4. Create HCS Topics (Optional)
If you're using Hedera Consensus Service for audit trails:

```bash
# Use Hedera SDK to create topics
cd ../backend
npm run setup:hcs
```

### 5. Create HTS Tokens (Optional)
If you're using Hedera Token Service:

```bash
# Use Hedera SDK to create tokens
npm run setup:hts
```

## Network Information

### Hedera Testnet Details
- **Network**: Hedera Testnet
- **Chain ID**: 296 (Hedera Testnet EVM)
- **RPC URL**: https://testnet.hashio.io/api
- **Explorer**: https://hashscan.io/testnet
- **Faucet**: https://portal.hedera.com/faucet

### Hedera Mainnet Details (Future)
- **Network**: Hedera Mainnet
- **Chain ID**: 295
- **RPC URL**: https://mainnet.hashio.io/api
- **Explorer**: https://hashscan.io/mainnet

## Troubleshooting

### Issue: "Insufficient balance"
**Solution**: Fund your account with testnet HBAR from the faucet

### Issue: "RPC connection failed"
**Solution**: 
- Check your internet connection
- Verify the RPC URL is correct
- Try alternative RPC: https://pool.arkhia.io/hedera/testnet/json-rpc/v1

### Issue: "Private key invalid"
**Solution**: 
- Ensure private key is in hex format
- Remove `0x` prefix if present
- Verify key corresponds to your Hedera account

### Issue: "Contract deployment reverted"
**Solution**:
- Check deployer account has ADMIN role
- Ensure contract parameters are correct
- Review transaction logs with `-vvvv` flag

## Cost Estimation

Approximate deployment costs on Hedera Testnet:
- **Diamond Proxy**: ~0.5 HBAR
- **Each Facet**: ~0.3-0.5 HBAR each (10 facets)
- **DiamondCut Transaction**: ~0.2 HBAR
- **Total**: ~5-7 HBAR for complete deployment

Hedera Mainnet costs are similar but use real HBAR.

## Security Checklist

Before mainnet deployment:
- [ ] Remove all hardcoded private keys
- [ ] Use environment variables for all sensitive data
- [ ] Test all facet functions on testnet
- [ ] Complete security audit
- [ ] Set up multi-sig wallet for contract ownership
- [ ] Prepare upgrade procedures
- [ ] Document emergency procedures

## Support

For issues:
1. Check the logs with `-vvvv` flag
2. Review Hedera documentation: https://docs.hedera.com
3. Ask in Hedera Discord: https://hedera.com/discord
4. Check AfriHealth documentation

## Next Steps

After successful deployment:
1. Test all contract functions
2. Set up frontend integration
3. Configure backend services
4. Set up monitoring and alerting
5. Prepare for mainnet deployment
