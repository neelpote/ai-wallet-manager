# Wallet Connection System

## Overview

The AI Wallet Manager now supports multiple wallet connection methods, making it easier and more secure to connect to the Stellar network without manually entering private keys.

## Supported Wallets

### 🚀 **Freighter Wallet** (Recommended)
- **Type**: Browser Extension
- **Security**: Highest - Private keys never leave the extension
- **Installation**: [Chrome Web Store](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)
- **Features**: 
  - Hardware wallet support
  - Transaction signing without exposing keys
  - Multi-account management
  - Testnet/Mainnet switching

### ⭐ **Albedo Wallet**
- **Type**: Web-based
- **Security**: High - Keys stored securely in browser
- **Access**: [albedo.link](https://albedo.link)
- **Features**:
  - No installation required
  - Works on any device
  - Transaction signing interface
  - Multi-signature support

### 🔑 **Manual Entry**
- **Type**: Direct key input
- **Security**: Medium - Keys entered directly
- **Use Case**: Testing, development, generated keys
- **Features**:
  - Key generation for testnet
  - Full control over keys
  - Fallback option

## How It Works

### Connection Flow

1. **Wallet Detection**: App automatically detects available wallets
2. **User Selection**: User chooses preferred connection method
3. **Authentication**: Wallet handles authentication securely
4. **Public Key Retrieval**: Only public key is shared with the app
5. **Transaction Signing**: Transactions are signed by the wallet when needed

### Security Model

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Wallet     │    │   User's Wallet  │    │  Stellar Network│
│   Manager       │    │   (Freighter/    │    │                 │
│                 │    │    Albedo)       │    │                 │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Public Key    │◄───┤ • Private Keys   │    │ • Transactions  │
│ • Balance Info  │    │ • Transaction    │◄───┤ • Account Data  │
│ • Transaction   │────┤   Signing        │────┤ • Network State │
│   Requests      │    │ • User Approval  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation Details

### WalletConnectionService

```typescript
// Check available wallets
const wallets = await WalletConnectionService.getAvailableWallets()

// Connect to specific wallet
const walletInfo = await WalletConnectionService.connectWallet('freighter')

// Sign transactions
const signedXdr = await WalletConnectionService.signTransaction(xdr, 'freighter')
```

### TransactionSigner

```typescript
// Create and sign payment
const result = await TransactionSigner.createAndSignPayment(
  sourcePublicKey,
  destinationPublicKey,
  amount,
  secretKey // Only needed for manual entry
)

// Check if secret key is required
const needsSecret = TransactionSigner.requiresSecretKey()
```

## User Experience

### Before (Manual Entry Only)
```
1. User must have/generate Stellar keys
2. Copy/paste 56-character secret key
3. Risk of key exposure
4. Manual key management
```

### After (Multiple Options)
```
1. Choose wallet type
2. One-click connection
3. Secure transaction signing
4. No key exposure risk
```

## Features

### ✅ **Enhanced Security**
- Private keys never exposed to the application
- Wallet-native transaction approval
- Secure key storage in browser extensions
- Hardware wallet support (via Freighter)

### ✅ **Better User Experience**
- One-click wallet connection
- No manual key entry required
- Visual wallet selection interface
- Clear connection status

### ✅ **Multiple Options**
- Browser extension wallets
- Web-based wallets
- Manual entry fallback
- Automatic wallet detection

### ✅ **Developer Friendly**
- Clean API for wallet integration
- Consistent signing interface
- Error handling and fallbacks
- TypeScript support

## Installation Instructions

### For Freighter Users
1. Install [Freighter Extension](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)
2. Create or import Stellar account
3. Switch to Testnet in extension settings
4. Click "Freighter" in AI Wallet Manager
5. Approve connection in extension popup

### For Albedo Users
1. Visit [albedo.link](https://albedo.link)
2. Create or import Stellar account
3. Click "Albedo" in AI Wallet Manager
4. Complete authentication on Albedo site
5. Return to AI Wallet Manager

### For Manual Entry
1. Click "Manual Entry"
2. Enter existing keys or click "Generate Keys"
3. Click "Connect Wallet"

## Error Handling

### Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Freighter not found" | Extension not installed | Install Freighter extension |
| "Albedo not available" | Popup blocked or network issue | Check popup blocker, try again |
| "Connection rejected" | User denied permission | Try connecting again |
| "Invalid keys" | Wrong key format | Check key format (G... for public, S... for secret) |

## Migration from Manual Entry

Existing users with manual entry can:

1. **Continue using manual entry** - No changes required
2. **Upgrade to Freighter** - Install extension, import existing keys
3. **Switch to Albedo** - Import keys to Albedo wallet
4. **Use multiple wallets** - Different wallets for different purposes

## Benefits

### For Users
- 🔒 **Enhanced Security**: Private keys stay in secure wallets
- 🚀 **Easier Connection**: One-click wallet connection
- 💼 **Professional Tools**: Use industry-standard wallets
- 🔄 **Seamless Experience**: No manual key management

### For Developers
- 🛠️ **Standard Integration**: Uses official Stellar wallet SDKs
- 🔧 **Flexible Architecture**: Supports multiple wallet types
- 📚 **Well Documented**: Clear APIs and error handling
- 🧪 **Testnet Ready**: Perfect for development and testing

The new wallet connection system provides a more secure, user-friendly, and professional way to interact with the Stellar network while maintaining backward compatibility with manual key entry.