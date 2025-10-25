import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { publicKey, amount } = await request.json();
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    // Get spending limit from request or use a default
    const limit = parseFloat(process.env.SPENDING_LIMIT || '1000');
    const requestAmount = parseFloat(amount || '0');

    if (requestAmount > limit) {
      return NextResponse.json({
        allowed: false,
        limit: limit,
        requested: requestAmount,
        message: `Transaction amount ${requestAmount} XLM exceeds spending limit of ${limit} XLM`
      });
    }

    return NextResponse.json({
      allowed: true,
      limit: limit,
      requested: requestAmount,
      message: `Transaction amount ${requestAmount} XLM is within spending limit of ${limit} XLM`
    });
    
  } catch (error: any) {
    console.error('Limit check error:', error);
    return NextResponse.json(
      { error: error.message, allowed: false },
      { status: 500 }
    );
  }
}