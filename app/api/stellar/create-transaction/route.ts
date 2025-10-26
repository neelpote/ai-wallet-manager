import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Use environment variable to determine network, default to testnet
const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
const server = new StellarSdk.Horizon.Server(
  isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
);
const networkPassphrase = isMainnet ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET;



export async function POST(request: NextRequest) {
  try {
    const { publicKey, recipient, amount } = await request.json();

    if (!publicKey || !recipient || !amount) {
      throw new Error('Public key, recipient, and amount are required');
    }

    // Validate Stellar address
    if (!recipient.startsWith('G') || recipient.length !== 56) {
      throw new Error('Invalid Stellar address format');
    }

    // Validate amount
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid amount');
    }

    // Check if destination account exists
    try {
      await server.loadAccount(recipient);
    } catch (destError: any) {
      if (destError.response?.status === 404) {
        throw new Error(`The recipient account does not exist on the Stellar network. You can only send XLM to accounts that have been funded at least once.`);
      }
    }

    // Load source account
    const sourceAccount = await server.loadAccount(publicKey);
    
    // Create unsigned transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipient,
          asset: StellarSdk.Asset.native(),
          amount: numAmount.toString(),
        })
      )
      .setTimeout(30)
      .build();
    
    return NextResponse.json({
      success: true,
      transactionXDR: transaction.toXDR(),
      amount: numAmount,
      recipient: recipient,
      message: 'Transaction created successfully, ready for signing'
    });
    
  } catch (error: any) {
    console.error('Create transaction error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 400 }
    );
  }
}