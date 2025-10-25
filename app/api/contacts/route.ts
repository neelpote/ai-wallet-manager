import { NextRequest, NextResponse } from 'next/server';

// In a real app, you'd use a database. For now, we'll use localStorage simulation
// This will be handled on the client side since we can't persist server-side without a DB

export async function GET(request: NextRequest) {
  // This endpoint will be used to get all contacts
  // The actual storage will be handled client-side
  return NextResponse.json({ 
    message: 'Contacts are stored client-side. Use the client-side API.' 
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, name, address, publicKey } = await request.json();
    
    if (!publicKey) {
      throw new Error('Public key is required');
    }

    switch (action) {
      case 'add':
        if (!name || !address) {
          throw new Error('Name and address are required');
        }
        
        // Validate Stellar address
        if (!address.startsWith('G') || address.length !== 56) {
          throw new Error('Invalid Stellar address format');
        }
        
        return NextResponse.json({
          success: true,
          message: `Contact "${name}" saved with address ${address}`,
          contact: { name, address }
        });
        
      case 'get':
        if (!name) {
          throw new Error('Name is required');
        }
        
        return NextResponse.json({
          success: true,
          message: 'Contact lookup - handled client-side'
        });
        
      case 'list':
        return NextResponse.json({
          success: true,
          message: 'Contact list - handled client-side'
        });
        
      case 'delete':
        if (!name) {
          throw new Error('Name is required');
        }
        
        return NextResponse.json({
          success: true,
          message: `Contact "${name}" deleted`
        });
        
      default:
        throw new Error('Invalid action. Use: add, get, list, or delete');
    }
    
  } catch (error: any) {
    console.error('Contacts error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}