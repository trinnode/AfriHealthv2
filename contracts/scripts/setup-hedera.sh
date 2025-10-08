#!/bin/bash

# Quick Setup Script for Hedera Deployment
# This script helps you set up your environment for deploying to Hedera

echo "=================================================="
echo "AfriHealth - Hedera Deployment Setup"
echo "=================================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Create .env file
echo "Creating .env file..."
cp .env.example .env

echo ""
echo "✓ .env file created"
echo ""
echo "=================================================="
echo "Please edit .env and add your credentials:"
echo "=================================================="
echo ""
echo "1. Get testnet HBAR from: https://portal.hedera.com/faucet"
echo "2. Create a Hedera testnet account at: https://portal.hedera.com/"
echo "3. Export your private key from your wallet"
echo "4. Update .env with your private key and account ID"
echo ""
echo "Then run: ./scripts/deploy-hedera.sh"
echo ""

# Make deployment script executable
chmod +x scripts/deploy-hedera.sh

echo "✓ Deployment script is now executable"
echo ""
