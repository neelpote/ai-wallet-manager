#!/bin/bash

# Stellar Smart Contract Deployment Script
# Make sure you have Soroban CLI installed: https://soroban.stellar.org/docs/getting-started/setup

set -e

echo "🚀 Starting Stellar Smart Contract Deployment..."

# Check if soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI not found. Please install it first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "   cargo install --locked soroban-cli"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "contracts/wallet-guard/Cargo.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Build the contract
echo "🔨 Building smart contract..."
cd contracts/wallet-guard
soroban contract build

# Check if build was successful
if [ ! -f "target/wasm32-unknown-unknown/release/wallet_guard.wasm" ]; then
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

echo "✅ Contract built successfully!"

# Go back to project root
cd ../..

# Deploy to testnet
echo "🌐 Deploying to Stellar Testnet..."

# You need to set up your Stellar account first
# Replace 'alice' with your account name or use --source-account flag
CONTRACT_ID=$(soroban contract deploy \
    --wasm contracts/wallet-guard/target/wasm32-unknown-unknown/release/wallet_guard.wasm \
    --source alice \
    --network testnet 2>/dev/null || echo "DEPLOYMENT_FAILED")

if [ "$CONTRACT_ID" = "DEPLOYMENT_FAILED" ]; then
    echo "❌ Deployment failed. Make sure you have:"
    echo "   1. Set up a Stellar account: soroban keys generate alice"
    echo "   2. Fund the account: soroban keys fund alice --network testnet"
    echo "   3. Configure testnet: soroban network add testnet --global --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase 'Test SDF Network ; September 2015'"
    echo ""
    echo "Run these commands to set up:"
    echo "   soroban keys generate alice"
    echo "   soroban keys fund alice --network testnet"
    echo "   soroban network add testnet --global --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase 'Test SDF Network ; September 2015'"
    exit 1
fi

echo "🎉 Contract deployed successfully!"
echo "📋 Contract ID: $CONTRACT_ID"

# Update environment file
if [ -f ".env.local" ]; then
    # Update existing .env.local
    sed -i.bak "s/SOROBAN_CONTRACT_ID=.*/SOROBAN_CONTRACT_ID=$CONTRACT_ID/" .env.local
    sed -i.bak "s/NEXT_PUBLIC_CONTRACT_ID=.*/NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID/" .env.local
    echo "✅ Updated .env.local with contract ID"
else
    # Create new .env.local
    echo "SOROBAN_CONTRACT_ID=$CONTRACT_ID" >> .env.local
    echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> .env.local
    echo "✅ Created .env.local with contract ID"
fi

echo ""
echo "🔧 Next steps:"
echo "1. Your contract is deployed at: $CONTRACT_ID"
echo "2. Update your app to use the real contract instead of simulation"
echo "3. Test the contract functions"
echo ""
echo "📖 Contract functions available:"
echo "   - initialize(owner)"
echo "   - set_daily_limit(owner, limit)"
echo "   - set_monthly_limit(owner, limit)"
echo "   - validate_transaction(owner, amount)"
echo "   - freeze_wallet(owner)"
echo "   - unfreeze_wallet(owner)"
echo "   - add_contact(owner, name, address, is_trusted)"
echo "   - get_spending_info(owner)"
echo "   - get_wallet_settings(owner)"
echo ""
echo "🎯 Ready to integrate with your AI Wallet Manager!"