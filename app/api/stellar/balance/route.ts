import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Use environment variable to determine network, default to testnet
const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
const server = new StellarSdk.Horizon.Server(
  isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
);

export async function GET() {
  try {
    const publicKey = process.env.STELLAR_PUBLIC_KEY;
    
    if (!publicKey) {
      throw new Error('Public key not configured in environment');
    }

    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    const balance = nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00';

    return NextResponse.json({
      publicKey,
      balance
    });
    
  } catch (error: any) {
    console.error('Balance error:', error);
    return NextResponse.json(
      { error: error.message, balance: '0.00' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json();
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    const account = await server.loadAccount(publicKey);
    const nativeBalance = account.balances.find(b => b.asset_type === 'native');
    const balance = nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00';

    return NextResponse.json({
      publicKey,
      balance
    });
    
  } catch (error: any) {
    console.error('Balance error:', error);
    return NextResponse.json(
      { error: error.message, balance: '0.00' },
      { status: 500 }
    );
  }
}