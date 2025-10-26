# AI Wallet Manager

A Next.js application that provides an AI-powered interface for managing Stellar cryptocurrency wallets with multi-asset support and token swapping using natural language commands.

## Features

- 🤖 **AI-Powered Commands**: Use natural language to interact with your Stellar wallet
- 💼 **Multi-Asset Portfolio**: Manage XLM, USDC, EURC, AQUA, and YBX assets
- 🔄 **Token Swapping**: Swap between different Stellar assets directly in chat
- 💰 **Balance Checking**: View your multi-asset portfolio in real-time
- 📤 **Send Transactions**: Send any supported asset to other Stellar addresses
- 📊 **Transaction History**: View recent transactions and swap history
- 🎯 **Smart Contract Security**: Advanced spending limits and wallet freeze protection
- 🔗 **Trustline Management**: Check and manage asset trustlines
- 🔐 **Secure**: Uses your own Stellar keys (testnet supported)

## Supported Commands

### Basic Wallet Commands
- `"What's my balance?"` - Check your current balance
- `"Send 10 XLM to GXXX..."` - Send assets to a Stellar address
- `"Show my transaction history"` - View recent transactions
- `"List contacts"` - View saved contacts

### Multi-Asset & Swapping
- `"Show my portfolio"` - View all your assets and their values
- `"Swap 100 XLM to USDC"` - Swap between different assets
- `"What's the price of USDC?"` - Check current asset prices
- `"Check trustlines"` - View your asset trustlines
- `"Calculate swap 50 XLM to EURC"` - Estimate swap outputs
- `"Swap history"` - View your trading history

### Smart Contract Security
- `"Set daily limit to 500 XLM"` - Set spending limits
- `"Freeze my wallet"` - Emergency wallet freeze
- `"Status"` - Check wallet and security status
- `"Save contract Alice GXXX"` - Save contacts to blockchain

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Stellar SDK, Soroban Smart Contracts
- **AI**: Google Gemini AI (with fallback parser)
- **Network**: Stellar Testnet
- **Assets**: XLM, USDC, EURC, AQUA, YBX

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Stellar testnet account (keys)
- Google Gemini API key (optional - has fallback)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-wallet-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Gemini AI API Key (optional - has fallback parser)
GEMINI_API_KEY=your_gemini_api_key

# Stellar Keys (testnet)
STELLAR_PUBLIC_KEY=your_stellar_public_key
STELLAR_SECRET_KEY=your_stellar_secret_key
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**: Enter your Stellar public and secret keys
2. **Fund Account**: Use the "Fund Testnet" button to get test XLM
3. **Chat Interface**: Use natural language commands to manage your wallet
4. **View History**: Monitor your transactions in real-time

## API Endpoints

- `GET /api/stellar/balance` - Get account balance
- `POST /api/stellar/send` - Send XLM transaction
- `POST /api/stellar/history` - Get transaction history
- `POST /api/stellar/fund-testnet` - Fund testnet account
- `POST /api/stellar/create-account` - Create new Stellar account
- `POST /api/ai-parse` - Parse natural language commands

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Security Notes

- This application is designed for **testnet use only**
- Never commit your `.env.local` file with real credentials
- For production use, implement proper key management
- Always verify transactions before confirming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the Stellar documentation: https://developers.stellar.org/
- Gemini AI documentation: https://ai.google.dev/

---

Built with ❤️ using Next.js and Stellar