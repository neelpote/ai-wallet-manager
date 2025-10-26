# Wallet Guard Smart Contract

A Soroban smart contract for the AI Wallet Manager that provides advanced wallet security and management features.

## Features

### 🔒 Security Controls
- **Spending Limits**: Daily and monthly spending limits with automatic resets
- **Wallet Freezing**: Emergency freeze/unfreeze functionality
- **Transaction Validation**: Pre-transaction validation against limits and settings

### 👥 Contact Management
- **Contact Storage**: Store trusted contacts on-chain
- **Trust Levels**: Mark contacts as trusted for auto-approval
- **Address Book**: Persistent contact management across sessions

### 📊 Analytics & Logging
- **Transaction History**: On-chain transaction logging
- **Spending Analytics**: Track spending patterns and limits
- **Usage Statistics**: Monitor wallet usage and security events

### ⚙️ Wallet Settings
- **Customizable Limits**: Set maximum transaction amounts
- **Security Preferences**: Configure auto-approval and memo requirements
- **Emergency Contacts**: Designate emergency contacts for wallet recovery

## Contract Functions

### Initialization
```rust
initialize(owner: Address)
```
Initialize wallet with default settings for a new user.

### Spending Limits
```rust
set_daily_limit(owner: Address, limit: i128)
set_monthly_limit(owner: Address, limit: i128)
validate_transaction(owner: Address, amount: i128) -> bool
reset_spending_limits(owner: Address)
```

### Security Controls
```rust
freeze_wallet(owner: Address)
unfreeze_wallet(owner: Address)
```

### Contact Management
```rust
add_contact(owner: Address, name: String, address: Address, is_trusted: bool)
remove_contact(owner: Address, name: String)
set_contact_trusted(owner: Address, name: String, is_trusted: bool)
get_contact(owner: Address, name: String) -> Option<Contact>
get_all_contacts(owner: Address) -> Map<String, Contact>
```

### Transaction Logging
```rust
log_transaction(owner: Address, to: Address, amount: i128, memo: String)
get_transaction_history(owner: Address) -> Vec<Transaction>
```

### Settings Management
```rust
set_wallet_settings(owner: Address, settings: WalletSettings)
get_wallet_settings(owner: Address) -> WalletSettings
```

### View Functions
```rust
get_spending_info(owner: Address) -> SpendingInfo
```

## Data Structures

### SpendingInfo
```rust
pub struct SpendingInfo {
    pub daily_limit: i128,      // Daily spending limit in stroops
    pub monthly_limit: i128,    // Monthly spending limit in stroops
    pub daily_spent: i128,      // Amount spent today
    pub monthly_spent: i128,    // Amount spent this month
    pub day_start: u64,         // Timestamp of current day start
    pub month_start: u64,       // Timestamp of current month start
    pub is_frozen: bool,        // Wallet freeze status
}
```

### Contact
```rust
pub struct Contact {
    pub name: String,           // Contact display name
    pub address: Address,       // Stellar address
    pub is_trusted: bool,       // Trust status for auto-approval
}
```

### WalletSettings
```rust
pub struct WalletSettings {
    pub auto_approve_trusted: bool,  // Auto-approve trusted contacts
    pub require_memo: bool,          // Require memo for transactions
    pub max_tx_amount: i128,         // Maximum single transaction amount
    pub emergency_contact: Address,  // Emergency contact address
}
```

### Transaction
```rust
pub struct Transaction {
    pub from: Address,          // Sender address
    pub to: Address,            // Recipient address
    pub amount: i128,           // Transaction amount in stroops
    pub timestamp: u64,         // Transaction timestamp
    pub memo: String,           // Transaction memo
}
```

## Deployment

### Prerequisites
1. Install Rust and Soroban CLI:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli
```

2. Set up Stellar testnet account:
```bash
soroban keys generate alice
soroban keys fund alice --network testnet
soroban network add testnet --global --rpc-url https://soroban-testnet.stellar.org:443 --network-passphrase "Test SDF Network ; September 2015"
```

### Deploy Contract
```bash
# From project root
./deploy-contract.sh
```

This will:
1. Build the contract
2. Deploy to Stellar testnet
3. Update your `.env.local` with the contract ID
4. Provide integration instructions

### Manual Deployment
```bash
# Build
cd contracts/wallet-guard
soroban contract build

# Deploy
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/wallet_guard.wasm \
  --source alice \
  --network testnet
```

## Integration with AI Wallet Manager

After deployment, update your app to use the real contract:

1. **Install Stellar SDK**:
```bash
npm install @stellar/stellar-sdk
```

2. **Update API endpoint** (`app/api/stellar/smart-limit/route.ts`):
```typescript
import { Contract, SorobanRpc, TransactionBuilder } from '@stellar/stellar-sdk';

const CONTRACT_ADDRESS = process.env.SOROBAN_CONTRACT_ID;
const contract = new Contract(CONTRACT_ADDRESS);

// Replace simulation with real contract calls
const result = await contract.call('set_daily_limit', owner, limit);
```

3. **Environment Variables**:
```env
SOROBAN_CONTRACT_ID=your_deployed_contract_id
NEXT_PUBLIC_CONTRACT_ID=your_deployed_contract_id
```

## Testing

Run contract tests:
```bash
cd contracts/wallet-guard
cargo test
```

## Security Considerations

- **Authorization**: All state-changing functions require owner authentication
- **Spending Limits**: Automatic time-based resets prevent limit bypass
- **Freeze Protection**: Frozen wallets reject all transactions
- **Data Persistence**: All data stored on Stellar blockchain
- **Gas Optimization**: Efficient storage and computation patterns

## Cost Considerations

- **Storage**: Each data structure uses Stellar's storage system
- **Transactions**: Each function call requires XLM for fees
- **Optimization**: Contract optimized for minimal resource usage

## Mainnet Deployment

For production deployment:

1. Change network to mainnet
2. Use funded mainnet account
3. Update RPC URL to mainnet
4. Test thoroughly on testnet first

```bash
soroban network add mainnet --global --rpc-url https://soroban-mainnet.stellar.org:443 --network-passphrase "Public Global Stellar Network ; September 2015"
```

## Support

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar Developer Discord](https://discord.gg/stellardev)
- [Soroban Examples](https://github.com/stellar/soroban-examples)