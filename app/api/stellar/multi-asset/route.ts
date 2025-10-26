import { NextRequest, NextResponse } from 'next/server'
import * as StellarSdk from '@stellar/stellar-sdk'

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
// Note: SorobanRpc might not be available in this version, commenting out for now
// const sorobanServer = new StellarSdk.SorobanRpc.Server('https://soroban-testnet.stellar.org')

// Common Stellar assets
const STELLAR_ASSETS = {
  'XLM': StellarSdk.Asset.native(),
  'USDC': new StellarSdk.Asset('USDC', 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  'EURC': new StellarSdk.Asset('EURC', 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'),
  'AQUA': new StellarSdk.Asset('AQUA', 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA'),
  'YBX': new StellarSdk.Asset('YBX', 'GBUYUAI75XXWDZEKLY66CFYKQPET5JR4EENXZBUZ3YXZ7DS56Z4OKOFU')
}

// Mock price data (in production, this would come from an oracle)
const ASSET_PRICES_XLM = {
  'XLM': 1.0,
  'USDC': 8.5, // 1 USDC = 8.5 XLM (example)
  'EURC': 9.2, // 1 EURC = 9.2 XLM (example)
  'AQUA': 0.15, // 1 AQUA = 0.15 XLM (example)
  'YBX': 2.3 // 1 YBX = 2.3 XLM (example)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, publicKey, secretKey } = body

    if (!publicKey) {
      return NextResponse.json({ error: 'Public key is required' }, { status: 400 })
    }

    switch (action) {
      case 'get_portfolio':
        return await getPortfolio(publicKey)
      
      case 'get_asset_prices':
        return await getAssetPrices()
      
      case 'create_swap_order':
        return await createSwapOrder(body)
      
      case 'execute_swap':
        return await executeSwap(body)
      
      case 'get_swap_history':
        return await getSwapHistory(publicKey)
      
      case 'calculate_swap':
        return await calculateSwap(body)
      
      case 'get_supported_assets':
        return await getSupportedAssets()
      
      case 'check_trustlines':
        return await checkTrustlines(publicKey)
      
      default:
        return NextResponse.json({ error: 'Invalid action: ' + action }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Multi-asset API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Multi-asset API is working',
    endpoints: [
      'get_portfolio',
      'get_asset_prices', 
      'execute_swap',
      'calculate_swap',
      'get_swap_history',
      'get_supported_assets',
      'check_trustlines'
    ]
  })
}

async function getPortfolio(publicKey: string) {
  try {
    const account = await server.loadAccount(publicKey)
    const portfolio: any = {
      owner: publicKey,
      assets: {},
      totalValueXLM: 0,
      lastUpdated: new Date().toISOString()
    }

    // Get XLM balance
    const xlmBalance = parseFloat(account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0')
    portfolio.assets['XLM'] = {
      code: 'XLM',
      balance: xlmBalance,
      priceXLM: 1.0,
      valueXLM: xlmBalance,
      issuer: null
    }
    portfolio.totalValueXLM += xlmBalance

    // Get other asset balances
    for (const balance of account.balances) {
      if (balance.asset_type !== 'native') {
        const assetCode = balance.asset_code
        const assetBalance = parseFloat(balance.balance)
        const priceXLM = ASSET_PRICES_XLM[assetCode as keyof typeof ASSET_PRICES_XLM] || 1.0
        const valueXLM = assetBalance * priceXLM

        portfolio.assets[assetCode] = {
          code: assetCode,
          balance: assetBalance,
          priceXLM,
          valueXLM,
          issuer: balance.asset_issuer
        }
        portfolio.totalValueXLM += valueXLM
      }
    }

    return NextResponse.json({ portfolio })
  } catch (error: any) {
    console.error('Portfolio error:', error)
    return NextResponse.json({ 
      error: 'Failed to load portfolio: ' + error.message 
    }, { status: 500 })
  }
}

async function getAssetPrices() {
  try {
    // In production, this would fetch from price oracles
    const prices = Object.entries(ASSET_PRICES_XLM).map(([code, priceXLM]) => ({
      code,
      priceXLM,
      priceUSD: priceXLM * 0.12, // Assuming 1 XLM = $0.12
      change24h: (Math.random() - 0.5) * 10 // Random change for demo
    }))

    return NextResponse.json({ prices })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get asset prices: ' + error.message 
    }, { status: 500 })
  }
}

async function createSwapOrder(body: any) {
  try {
    const { publicKey, secretKey, fromAsset, toAsset, amount, minReceive } = body

    if (!secretKey) {
      return NextResponse.json({ error: 'Secret key required for swaps' }, { status: 400 })
    }

    // Validate assets
    if (!STELLAR_ASSETS[fromAsset as keyof typeof STELLAR_ASSETS] || 
        !STELLAR_ASSETS[toAsset as keyof typeof STELLAR_ASSETS]) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 })
    }

    // Format amounts for Stellar (max 7 decimal places)
    const formatStellarAmount = (num: number): string => {
      return num.toFixed(7).replace(/\.?0+$/, '')
    }

    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey)
    const account = await server.loadAccount(publicKey)

    // Create path payment operation for the swap
    const fromAssetObj = STELLAR_ASSETS[fromAsset as keyof typeof STELLAR_ASSETS]
    const toAssetObj = STELLAR_ASSETS[toAsset as keyof typeof STELLAR_ASSETS]

    const sendAmount = formatStellarAmount(parseFloat(amount))
    const destMinAmount = formatStellarAmount(parseFloat(minReceive))

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: fromAssetObj,
        sendAmount: sendAmount,
        destination: publicKey,
        destAsset: toAssetObj,
        destMin: destMinAmount,
        path: [] // Direct swap, no intermediate assets
      }))
      .addMemo(StellarSdk.Memo.text(`Swap ${amount} ${fromAsset} to ${toAsset}`))
      .setTimeout(300)
      .build()

    transaction.sign(sourceKeypair)

    const result = await server.submitTransaction(transaction)

    return NextResponse.json({
      success: true,
      transactionId: result.hash,
      swapOrder: {
        id: result.hash.slice(0, 8),
        fromAsset,
        toAsset,
        amount: parseFloat(amount),
        minReceive: parseFloat(minReceive),
        status: 'completed',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Swap order error:', error)
    return NextResponse.json({ 
      error: 'Failed to create swap order: ' + error.message 
    }, { status: 500 })
  }
}

async function executeSwap(body: any) {
  try {
    const { publicKey, secretKey, fromAsset, toAsset, amount } = body

    if (!secretKey) {
      return NextResponse.json({ error: 'Secret key required for swaps' }, { status: 400 })
    }

    // Validate assets
    if (!STELLAR_ASSETS[fromAsset as keyof typeof STELLAR_ASSETS] || 
        !STELLAR_ASSETS[toAsset as keyof typeof STELLAR_ASSETS]) {
      return NextResponse.json({ error: 'Unsupported asset' }, { status: 400 })
    }

    // Validate amount
    const swapAmount = parseFloat(amount)
    if (isNaN(swapAmount) || swapAmount <= 0) {
      return NextResponse.json({ error: 'Invalid swap amount' }, { status: 400 })
    }

    // Load account to check balances and trustlines
    const account = await server.loadAccount(publicKey)
    
    // Check if user has sufficient balance of the source asset
    const sourceBalance = account.balances.find(b => {
      if (fromAsset === 'XLM') {
        return b.asset_type === 'native'
      } else {
        return b.asset_code === fromAsset && b.asset_type !== 'native'
      }
    })

    if (!sourceBalance) {
      return NextResponse.json({ 
        error: `No trustline found for ${fromAsset}. Please add a trustline first.` 
      }, { status: 400 })
    }

    const availableBalance = parseFloat(sourceBalance.balance)
    if (availableBalance < swapAmount) {
      return NextResponse.json({ 
        error: `Insufficient ${fromAsset} balance. Available: ${availableBalance}, Required: ${swapAmount}` 
      }, { status: 400 })
    }

    // Check if user has trustline for destination asset (unless it's XLM)
    if (toAsset !== 'XLM') {
      const destBalance = account.balances.find(b => 
        b.asset_code === toAsset && b.asset_type !== 'native'
      )
      
      if (!destBalance) {
        return NextResponse.json({ 
          error: `No trustline found for ${toAsset}. Please add a trustline first.` 
        }, { status: 400 })
      }
    }

    // Calculate expected output
    const fromPrice = ASSET_PRICES_XLM[fromAsset as keyof typeof ASSET_PRICES_XLM] || 1.0
    const toPrice = ASSET_PRICES_XLM[toAsset as keyof typeof ASSET_PRICES_XLM] || 1.0
    const expectedOutput = (swapAmount * fromPrice / toPrice) * 0.997 // 0.3% fee

    // Format amounts for Stellar (max 7 decimal places)
    const formatStellarAmount = (num: number): string => {
      return num.toFixed(7).replace(/\.?0+$/, '')
    }

    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey)

    const fromAssetObj = STELLAR_ASSETS[fromAsset as keyof typeof STELLAR_ASSETS]
    const toAssetObj = STELLAR_ASSETS[toAsset as keyof typeof STELLAR_ASSETS]

    const sendAmount = formatStellarAmount(swapAmount)
    const destMin = formatStellarAmount(expectedOutput * 0.95) // 5% slippage tolerance

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: fromAssetObj,
        sendAmount: sendAmount,
        destination: publicKey,
        destAsset: toAssetObj,
        destMin: destMin,
        path: []
      }))
      .addMemo(StellarSdk.Memo.text(`Swap ${amount} ${fromAsset} → ${toAsset}`))
      .setTimeout(300)
      .build()

    transaction.sign(sourceKeypair)

    const result = await server.submitTransaction(transaction)

    return NextResponse.json({
      success: true,
      transactionId: result.hash,
      amountReceived: expectedOutput,
      swap: {
        fromAsset,
        toAsset,
        amountIn: parseFloat(amount),
        amountOut: expectedOutput,
        rate: expectedOutput / parseFloat(amount),
        fee: parseFloat(amount) * 0.003,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Execute swap error:', error)
    return NextResponse.json({ 
      error: 'Failed to execute swap: ' + error.message 
    }, { status: 500 })
  }
}

async function calculateSwap(body: any) {
  try {
    const { fromAsset, toAsset, amount } = body

    const fromPrice = ASSET_PRICES_XLM[fromAsset as keyof typeof ASSET_PRICES_XLM] || 1.0
    const toPrice = ASSET_PRICES_XLM[toAsset as keyof typeof ASSET_PRICES_XLM] || 1.0
    
    const amountIn = parseFloat(amount)
    const amountOut = (amountIn * fromPrice / toPrice) * 0.997 // 0.3% fee
    const fee = amountIn * 0.003
    const rate = amountOut / amountIn
    const priceImpact = 0.1 // Mock price impact

    return NextResponse.json({
      calculation: {
        fromAsset,
        toAsset,
        amountIn,
        amountOut,
        rate,
        fee,
        priceImpact,
        minimumReceived: amountOut * 0.95, // 5% slippage
        route: [fromAsset, toAsset] // Direct route
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to calculate swap: ' + error.message 
    }, { status: 500 })
  }
}

async function getSwapHistory(publicKey: string) {
  try {
    // Get recent transactions
    const transactions = await server.transactions()
      .forAccount(publicKey)
      .order('desc')
      .limit(20)
      .call()

    const swapHistory = []

    for (const tx of transactions.records) {
      try {
        const operations = await tx.operations()
        
        for (const op of operations.records) {
          if (op.type === 'path_payment_strict_send' || op.type === 'path_payment_strict_receive') {
            const memo = tx.memo || ''
            if (memo.includes('Swap') || memo.includes('→')) {
              swapHistory.push({
                id: tx.hash.slice(0, 8),
                transactionId: tx.hash,
                fromAsset: op.source_asset_type === 'native' ? 'XLM' : op.source_asset_code,
                toAsset: op.asset_type === 'native' ? 'XLM' : op.asset_code,
                amountIn: parseFloat(op.source_amount || op.amount),
                amountOut: parseFloat(op.amount || op.source_amount),
                timestamp: tx.created_at,
                status: tx.successful ? 'completed' : 'failed',
                memo: memo
              })
            }
          }
        }
      } catch (opError) {
        console.log('Error processing transaction operations:', opError)
      }
    }

    return NextResponse.json({ swapHistory })
  } catch (error: any) {
    console.error('Swap history error:', error)
    return NextResponse.json({ 
      error: 'Failed to get swap history: ' + error.message 
    }, { status: 500 })
  }
}

async function getSupportedAssets() {
  try {
    const assets = Object.entries(STELLAR_ASSETS).map(([code, asset]) => ({
      code,
      name: getAssetName(code),
      issuer: asset.isNative() ? null : asset.getIssuer(),
      priceXLM: ASSET_PRICES_XLM[code as keyof typeof ASSET_PRICES_XLM] || 1.0,
      icon: getAssetIcon(code),
      description: getAssetDescription(code)
    }))

    return NextResponse.json({ assets })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to get supported assets: ' + error.message 
    }, { status: 500 })
  }
}

function getAssetName(code: string): string {
  const names: { [key: string]: string } = {
    'XLM': 'Stellar Lumens',
    'USDC': 'USD Coin',
    'EURC': 'Euro Coin',
    'AQUA': 'Aquarius',
    'YBX': 'YieldBlox'
  }
  return names[code] || code
}

function getAssetIcon(code: string): string {
  const icons: { [key: string]: string } = {
    'XLM': '⭐',
    'USDC': '💵',
    'EURC': '💶',
    'AQUA': '🌊',
    'YBX': '📈'
  }
  return icons[code] || '🪙'
}

function getAssetDescription(code: string): string {
  const descriptions: { [key: string]: string } = {
    'XLM': 'Native Stellar network token',
    'USDC': 'USD-backed stablecoin',
    'EURC': 'EUR-backed stablecoin',
    'AQUA': 'Aquarius AMM token',
    'YBX': 'YieldBlox DeFi token'
  }
  return descriptions[code] || 'Stellar asset'
}

async function checkTrustlines(publicKey: string) {
  try {
    const account = await server.loadAccount(publicKey)
    const trustlines: any = {
      established: [],
      missing: [],
      recommendations: []
    }

    // Check each supported asset
    Object.entries(STELLAR_ASSETS).forEach(([code, asset]) => {
      if (code === 'XLM') {
        // XLM is native, always available
        trustlines.established.push({
          code: 'XLM',
          name: 'Stellar Lumens',
          balance: account.balances.find(b => b.asset_type === 'native')?.balance || '0',
          icon: '⭐'
        })
      } else {
        // Check if trustline exists
        const balance = account.balances.find(b => 
          b.asset_code === code && b.asset_issuer === asset.getIssuer()
        )
        
        if (balance) {
          trustlines.established.push({
            code,
            name: getAssetName(code),
            balance: balance.balance,
            issuer: asset.getIssuer(),
            icon: getAssetIcon(code)
          })
        } else {
          trustlines.missing.push({
            code,
            name: getAssetName(code),
            issuer: asset.getIssuer(),
            icon: getAssetIcon(code),
            description: getAssetDescription(code)
          })
        }
      }
    })

    // Add recommendations
    if (trustlines.missing.length > 0) {
      trustlines.recommendations = [
        "To swap with these assets, you need to establish trustlines first.",
        "Use Stellar Laboratory (https://laboratory.stellar.org) to add trustlines.",
        "Or use a wallet like Freighter that supports trustline management.",
        "For testnet: Make sure to switch to testnet mode in your wallet."
      ]
    }

    return NextResponse.json({ trustlines })
  } catch (error: any) {
    console.error('Trustlines check error:', error)
    return NextResponse.json({ 
      error: 'Failed to check trustlines: ' + error.message 
    }, { status: 500 })
  }
}