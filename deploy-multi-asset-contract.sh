#!/bin/bash

# Multi-Asset Manager Smart Contract Deployment Script
# This script builds and deploys the multi-asset manager contract to Stellar testnet

set -e

echo "🚀 Multi-Asset Manager Smart Contract Deployment"
echo "================================================"

# Check if Soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI not found. Please install it first:"
    echo "   cargo install --locked soroban-cli"
    exit 1
fi

# Check if we have a funded account
if ! soroban keys list | grep -q "alice"; then
    echo "⚠️  No 'alice' key found. Creating and funding testnet account..."
    soroban keys generate alice
    echo "💰 Funding testnet account..."
    soroban keys fund alice --network testnet
fi

# Build the contract
echo "🔨 Building multi-asset manager contract..."
cd contracts/multi-asset-manager
soroban contract build

# Deploy the contract
echo "🚀 Deploying to Stellar testnet..."
CONTRACT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/multi_asset_manager.wasm \
  --source alice \
  --network testnet)

echo "✅ Multi-Asset Manager Contract deployed!"
echo "📋 Contract ID: $CONTRACT_ID"

# Initialize the contract
echo "🔧 Initializing contract..."
ALICE_ADDRESS=$(soroban keys address alice)
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  initialize \
  --admin $ALICE_ADDRESS

echo "✅ Contract initialized with admin: $ALICE_ADDRESS"

# Add some default assets
echo "💰 Adding default supported assets..."

# Add USDC
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  add_asset \
  --admin $ALICE_ADDRESS \
  --code "USDC" \
  --issuer "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" \
  --initial_price_xlm "85000000"

echo "✅ Added USDC asset"

# Add EURC
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  add_asset \
  --admin $ALICE_ADDRESS \
  --code "EURC" \
  --issuer "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2" \
  --initial_price_xlm "92000000"

echo "✅ Added EURC asset"

# Create some initial swap pools
echo "🏊 Creating initial swap pools..."

# XLM/USDC pool
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- \
  create_swap_pool \
  --admin $ALICE_ADDRESS \
  --asset_a "XLM" \
  --asset_b "USDC" \
  --initial_reserve_a "1000000000000" \
  --initial_reserve_b "100000000000" \
  --fee_rate 30

echo "✅ Created XLM/USDC swap pool"

# Update environment file
cd ../..
ENV_FILE=".env.local"

if [ -f "$ENV_FILE" ]; then
    # Remove existing multi-asset contract ID if present
    sed -i.bak '/MULTI_ASSET_CONTRACT_ID/d' "$ENV_FILE"
    sed -i.bak '/NEXT_PUBLIC_MULTI_ASSET_CONTRACT_ID/d' "$ENV_FILE"
fi

# Add new contract ID
echo "" >> "$ENV_FILE"
echo "# Multi-Asset Manager Smart Contract" >> "$ENV_FILE"
echo "MULTI_ASSET_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
echo "NEXT_PUBLIC_MULTI_ASSET_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"

echo "✅ Updated $ENV_FILE with contract ID"

echo ""
echo "🎉 Multi-Asset Manager Deployment Complete!"
echo "================================================"
echo "📋 Contract ID: $CONTRACT_ID"
echo "👤 Admin Address: $ALICE_ADDRESS"
echo "🌐 Network: Stellar Testnet"
echo ""
echo "📝 Next Steps:"
echo "1. Restart your Next.js development server"
echo "2. Try multi-asset commands in the chat:"
echo "   • 'Show my portfolio'"
echo "   • 'Swap 100 XLM to USDC'"
echo "   • 'What's the price of USDC?'"
echo ""
echo "🔗 Integration:"
echo "The contract is now integrated with your AI wallet manager."
echo "All multi-asset functionality is ready to use!"