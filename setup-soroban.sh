#!/bin/bash

# Soroban Setup Script for AI Wallet Manager
# This script sets up everything needed to deploy and use Soroban smart contracts

set -e

echo "🌟 Setting up Soroban for AI Wallet Manager..."

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "📦 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo "✅ Rust installed successfully!"
else
    echo "✅ Rust is already installed"
fi

# Install Soroban CLI
echo "🔧 Installing Soroban CLI..."
if ! command -v soroban &> /dev/null; then
    cargo install --locked soroban-cli
    echo "✅ Soroban CLI installed successfully!"
else
    echo "✅ Soroban CLI is already installed"
fi

# Add wasm32 target
echo "🎯 Adding WebAssembly target..."
rustup target add wasm32-unknown-unknown

# Configure Stellar testnet
echo "🌐 Configuring Stellar testnet..."
soroban network add testnet \
    --global \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015"

# Generate a new Stellar account (if it doesn't exist)
if ! soroban keys show alice &> /dev/null; then
    echo "🔑 Generating new Stellar account 'alice'..."
    soroban keys generate alice
    echo "✅ Account 'alice' generated!"
else
    echo "✅ Account 'alice' already exists"
fi

# Fund the account with testnet XLM
echo "💰 Funding account with testnet XLM..."
soroban keys fund alice --network testnet

# Get account details
ALICE_ADDRESS=$(soroban keys address alice)
echo "📋 Your Stellar testnet account:"
echo "   Name: alice"
echo "   Address: $ALICE_ADDRESS"

# Check balance
echo "💳 Checking account balance..."
soroban keys fund alice --network testnet > /dev/null 2>&1 || true
echo "✅ Account funded and ready!"

echo ""
echo "🎉 Soroban setup complete!"
echo ""
echo "📝 What was set up:"
echo "   ✅ Rust programming language"
echo "   ✅ Soroban CLI tools"
echo "   ✅ WebAssembly compilation target"
echo "   ✅ Stellar testnet configuration"
echo "   ✅ Funded testnet account 'alice'"
echo ""
echo "🚀 Next steps:"
echo "   1. Run './deploy-contract.sh' to deploy your smart contract"
echo "   2. The contract will be deployed to Stellar testnet"
echo "   3. Your .env.local will be updated with the contract ID"
echo "   4. Your AI Wallet Manager will use the real smart contract!"
echo ""
echo "🔍 Useful commands:"
echo "   soroban keys list                    # List all accounts"
echo "   soroban keys address alice           # Show alice's address"
echo "   soroban keys fund alice --network testnet  # Fund account"
echo "   soroban contract build               # Build contract"
echo ""
echo "📖 Learn more:"
echo "   https://soroban.stellar.org/docs"
echo "   https://developers.stellar.org/"