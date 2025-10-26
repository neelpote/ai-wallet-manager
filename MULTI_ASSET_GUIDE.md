# Multi-Asset Support & Token Swapping Guide

## 🚀 Overview

The AI Wallet Manager supports multiple Stellar assets with built-in token swapping functionality. Manage your entire portfolio, swap tokens directly in the chat interface, and track all your assets in one place.

## 🪙 Supported Assets

### Native Assets
- **XLM** ⭐ - Stellar Lumens (Native)
- **USDC** 💵 - USD Coin Stablecoin
- **EURC** 💶 - Euro Coin Stablecoin
- **AQUA** 🌊 - Aquarius AMM Token
- **YBX** 📈 - YieldBlox DeFi Token

### Asset Features
- Real-time price tracking
- Portfolio value calculation
- Swap rate calculations
- Transaction history
- Balance management

## 🔄 Token Swapping

### Chat Commands for Swapping

```bash
# Basic Swap Commands
"Swap 100 XLM to USDC"
"Convert 50 USDC to XLM"
"Exchange 25 XLM for EURC"

# Price Checking
"What's the price of USDC?"
"Show asset prices"
"Price of EURC in XLM"

# Portfolio Management
"Show my portfolio"
"My assets"
"Portfolio value"

# Swap Calculations
"Calculate swap 100 XLM to USDC"
"How much USDC for 100 XLM?"
"Estimate 50 USDC to XLM"

# Swap History
"Swap history"
"Show my swaps"
"Recent exchanges"
```

### Swap Features
- **Real-time Rates**: Live exchange rates between assets
- **Slippage Protection**: 5% maximum slippage tolerance
- **Fee Transparency**: 0.3% swap fee clearly displayed
- **Price Impact**: Shows how your trade affects the market
- **Minimum Received**: Guaranteed minimum amount you'll receive

## 💼 Portfolio Management

### Portfolio View
The portfolio interface shows:
- **Asset Balances**: Current holdings of each asset
- **XLM Values**: Value of each asset in XLM
- **Total Portfolio Value**: Combined value in XLM and USD
- **Price Information**: Current exchange rates
- **24h Changes**: Price movements (coming soon)

### Portfolio Commands
```bash
"Show my portfolio"          # View all assets
"My total value"            # Portfolio value
"Asset breakdown"           # Detailed view
"Refresh portfolio"         # Update balances
```

## 🔧 Smart Contract Integration

### Multi-Asset Manager Contract
The system uses a Soroban smart contract for:
- **Asset Management**: Track supported assets and prices
- **Swap Pools**: Automated Market Maker (AMM) functionality
- **Order Management**: Create and execute swap orders
- **Portfolio Tracking**: On-chain portfolio state
- **Price Oracles**: Asset price management

### Contract Functions
- `get_portfolio()` - Retrieve user portfolio
- `create_swap_order()` - Create new swap order
- `execute_swap()` - Execute token swap
- `calculate_swap_output()` - Calculate swap amounts
- `update_balance()` - Update asset balances

## 🚀 Getting Started

### 1. Deploy Multi-Asset Contract
```bash
# Run the deployment script
./deploy-multi-asset-contract.sh
```

### 2. Fund Your Account
```bash
# Get testnet XLM
"Fund my testnet account"
```

### 3. Add Asset Trustlines
For non-native assets, you need to establish trustlines:
```bash
# This will be handled automatically in future versions
# For now, use Stellar Laboratory or other tools
```

### 4. Start Swapping
```bash
# Check your portfolio
"Show my portfolio"

# Make your first swap
"Swap 10 XLM to USDC"

# Check swap history
"Swap history"
```

## 💡 Usage Examples

### Example 1: Basic Portfolio Check
```
User: "Show my portfolio"
AI: 💼 Your Multi-Asset Portfolio:

⭐ XLM: 1000.0000 (≈1000.00 XLM)
💵 USDC: 50.0000 (≈425.00 XLM)
💶 EURC: 25.0000 (≈230.00 XLM)

💰 Total Value: 1655.0000 XLM
💵 ≈ $198.60 USD
```

### Example 2: Token Swap
```
User: "Swap 100 XLM to USDC"
AI: ✅ Swap Successful!
🔄 100 XLM → 11.7647 USDC
💰 Rate: 1 XLM = 0.1176 USDC
📋 Transaction: a1b2c3d4...
```

### Example 3: Price Check
```
User: "What's the price of USDC?"
AI: 💹 Current Asset Prices:

💵 USDC: 8.5000 XLM ($1.0200) 📈 +2.34%
⭐ XLM: 1.0000 XLM ($0.1200) ➡️ +0.12%
💶 EURC: 9.2000 XLM ($1.1040) 📉 -1.23%
```

## 🔒 Security Features

### Swap Protection
- **Slippage Limits**: Maximum 5% slippage protection
- **Minimum Amounts**: Guaranteed minimum received
- **Transaction Limits**: Respect daily/monthly limits
- **Wallet Freeze**: Emergency stop functionality

### Smart Contract Security
- **Admin Controls**: Only authorized price updates
- **Pool Management**: Controlled liquidity pools
- **Order Validation**: Comprehensive order checking
- **Balance Verification**: Accurate balance tracking

## 📊 Advanced Features

### Coming Soon
- **Limit Orders**: Set target prices for automatic swaps
- **DCA (Dollar Cost Averaging)**: Automated recurring swaps
- **Yield Farming**: Earn rewards on asset pairs
- **Cross-Chain Bridges**: Connect to other networks
- **Advanced Analytics**: Detailed portfolio insights

### API Integration
The multi-asset system provides REST APIs:
- `POST /api/stellar/multi-asset` - Main multi-asset endpoint
- Actions: `get_portfolio`, `execute_swap`, `get_asset_prices`, etc.

## 🛠️ Technical Details

### Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat Interface│    │   Multi-Asset    │    │  Smart Contract │
│                 │    │   API            │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Natural Lang  │◄───┤ • Portfolio Mgmt │◄───┤ • Asset Storage │
│ • Swap Commands │    │ • Swap Execution │    │ • AMM Pools     │
│ • Price Display │    │ • Price Feeds    │    │ • Order Mgmt    │
│ • History View  │────┤ • Balance Sync   │────┤ • Price Oracle  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Swap Algorithm
Uses Constant Product Market Maker (CPMM):
```
(x + Δx) * (y - Δy) = x * y
```
Where:
- `x`, `y` = Pool reserves
- `Δx` = Input amount
- `Δy` = Output amount
- Fee = 0.3% of input

## 🐛 Troubleshooting

### Common Issues

**"Asset not supported"**
- Check if the asset is in the supported list
- Verify asset code spelling (XLM, USDC, etc.)

**"Insufficient balance"**
- Check your asset balance with "Show my portfolio"
- Ensure you have enough of the source asset

**"Swap failed"**
- Check if wallet is frozen
- Verify spending limits aren't exceeded
- Ensure slippage tolerance is reasonable

**"Price calculation failed"**
- Pool might have insufficient liquidity
- Try a smaller swap amount
- Check if asset prices are updated

### Getting Help
1. Use "Status" command to check wallet state
2. Try "Show my portfolio" to verify balances
3. Check swap history with "Swap history"
4. Verify contract deployment with deployment script

## 🎯 Best Practices

### For Swapping
1. **Check Prices First**: Use price commands before swapping
2. **Start Small**: Test with small amounts initially
3. **Monitor Slippage**: Large swaps may have higher slippage
4. **Set Limits**: Use spending limits for protection

### For Portfolio Management
1. **Regular Updates**: Refresh portfolio periodically
2. **Diversification**: Don't put all assets in one token
3. **Track History**: Monitor your swap history
4. **Security First**: Keep spending limits active

## 📈 Future Roadmap

### Phase 1 (Current)
- ✅ Multi-asset portfolio view
- ✅ Basic token swapping
- ✅ Price tracking
- ✅ Swap history

### Phase 2 (Coming Soon)
- 🔄 Advanced order types
- 🔄 Yield farming integration
- 🔄 Cross-chain bridges
- 🔄 Mobile app support

### Phase 3 (Future)
- 🔄 DeFi protocol integration
- 🔄 NFT support
- 🔄 Advanced analytics
- 🔄 Social trading features

---

## 🎉 Start Using Multi-Asset Features

Ready to start? Try these commands in your AI chat:

1. `"Show my portfolio"` - See all your assets
2. `"What's the price of USDC?"` - Check current prices  
3. `"Swap 10 XLM to USDC"` - Make your first swap
4. `"Swap history"` - View your trading history

The future of DeFi is here - manage multiple assets with simple chat commands! 🚀