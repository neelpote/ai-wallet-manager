import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Use environment variable to determine network, default to testnet
const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
const server = new StellarSdk.Horizon.Server(
  isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
);

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json();
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    const payments = await server.payments()
      .forAccount(publicKey)
      .limit(10)
      .order('desc')
      .call();
    
    const transactions = payments.records
      .filter((payment: any) => payment.type === 'payment')
      .map((payment: any) => ({
        id: payment.id,
        type: payment.from === publicKey ? 'send' : 'receive',
        amount: payment.amount,
        from: payment.from,
        to: payment.to,
        created_at: payment.created_at,
        successful: true
      }));

    return NextResponse.json({ transactions });
    
  } catch (error: any) {
    console.error('History error:', error);
    return NextResponse.json(
      { error: error.message, transactions: [] },
      { status: 500 }
    );
  }
}