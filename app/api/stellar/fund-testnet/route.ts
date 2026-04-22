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
    const friendbotUrl = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
    
    const response = await fetch(friendbotUrl);
    const result = await response.json();

    // Friendbot returns 400 if account already exists/funded — treat as success
    if (!response.ok) {
      const errMsg = result?.detail || result?.extras?.result_codes?.transaction || '';
      if (errMsg.includes('already') || errMsg.includes('op_already_exists') || response.status === 400) {
        return NextResponse.json({
          success: true,
          message: 'Account is already funded on testnet',
          alreadyFunded: true
        });
      }
      throw new Error(result?.detail || 'Failed to fund account via Friendbot');
    }
    
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
        suggestion: 'Make sure you are using a valid testnet public key'
      },
      { status: 500 }
    );
  }
}