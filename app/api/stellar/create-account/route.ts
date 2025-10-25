import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const networkPassphrase = StellarSdk.Networks.TESTNET;

export async function POST(request: NextRequest) {
  try {
    const { publicKey, secretKey, newAccountPublicKey, startingBalance } = await request.json();
    
    if (!secretKey || !newAccountPublicKey) {
      throw new Error('Secret key and new account public key are required');
    }

    const balance = startingBalance || 2; // Minimum 1 XLM + some extra

    // Validate new account address
    if (!newAccountPublicKey.startsWith('G') || newAccountPublicKey.length !== 56) {
      throw new Error('Invalid new account address format');
    }

    const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey);
    
    // Verify the public key matches the secret key
    if (sourceKeys.publicKey() !== publicKey) {
      throw new Error('Public and secret keys do not match');
    }

    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.createAccount({
          destination: newAccountPublicKey,
          startingBalance: balance.toString(),
        })
      )
      .setTimeout(30)
      .build();
    
    transaction.sign(sourceKeys);
    const result = await server.submitTransaction(transaction);
    
    return NextResponse.json({
      success: true,
      hash: result.hash,
      newAccount: newAccountPublicKey,
      startingBalance: balance,
      message: `Successfully created account ${newAccountPublicKey} with ${balance} XLM`
    });
    
  } catch (error: any) {
    console.error('Account creation error:', error);
    
    let errorMessage = error.message;
    
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      if (codes.operations?.includes('op_already_exists')) {
        errorMessage = 'Account already exists on the Stellar network.';
      } else if (codes.operations?.includes('op_underfunded')) {
        errorMessage = 'Insufficient balance to create new account (minimum 1 XLM required).';
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage
      },
      { status: 400 }
    );
  }
}