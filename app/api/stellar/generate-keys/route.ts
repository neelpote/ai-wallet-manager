import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

export async function POST(request: NextRequest) {
  try {
    // Generate a new random keypair
    const keypair = StellarSdk.Keypair.random();
    
    return NextResponse.json({
      success: true,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
      message: 'New testnet keypair generated successfully'
    });
    
  } catch (error: any) {
    console.error('Key generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate keypair'
      },
      { status: 500 }
    );
  }
}