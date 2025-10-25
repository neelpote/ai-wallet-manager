import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { publicKey } = await request.json();

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }

    // Use Stellar's Friendbot to fund testnet accounts
    const friendbotUrl = `https://friendbot.stellar.org/?addr=${publicKey}`;
    
    const response = await fetch(friendbotUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fund account via Friendbot');
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Account funded successfully with 10,000 test XLM',
      transaction: result
    });

  } catch (error: any) {
    console.error('Funding error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fund account',
        suggestion: 'Make sure you are using testnet and the public key is valid'
      },
      { status: 500 }
    );
  }
}