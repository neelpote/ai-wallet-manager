import { NextRequest, NextResponse } from 'next/server';
import * as StellarSdk from '@stellar/stellar-sdk';

// Use environment variable to determine network, default to testnet
const isMainnet = process.env.STELLAR_NETWORK === 'mainnet';
const server = new StellarSdk.Horizon.Server(
  isMainnet ? 'https://horizon.stellar.org' : 'https://horizon-testnet.stellar.org'
);
const networkPassphrase = isMainnet ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET;



export async function POST(request: NextRequest) {
  let recipient: string = '';
  
  try {
    const { publicKey, secretKey, recipient: recipientAddress, amount, signedTransaction } = await request.json();
    recipient = recipientAddress;
    
    // Handle pre-signed transactions (from Freighter)
    if (signedTransaction) {
      // Validate amount and recipient for signed transactions too
      if (!recipient || !amount) {
        throw new Error('Recipient and amount are required');
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // === MANDATORY SPENDING LIMIT VALIDATION FOR FREIGHTER ===
      try {
        // Always validate transaction with smart contract (required for spending limits)
        const validateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/stellar/smart-limit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'validate_transaction',
            publicKey,
            secretKey: '', // Freighter doesn't provide secret key
            contactAddress: recipient,
            amount: numAmount,
            memo: 'Freighter Wallet Transaction'
          })
        });
        
        const validateData = await validateResponse.json();
        
        if (!validateResponse.ok) {
          throw new Error(`Spending limit validation failed: ${validateData.error}`);
        }
        
        // ALWAYS block if the smart contract says no
        if (validateData.isValid === false) {
          const errors = validateData.errors || ['Transaction not allowed by spending limits'];
          throw new Error(`🚫 Transaction blocked: ${errors.join(', ')}`);
        }
        
        console.log('✅ Freighter transaction spending limit validation passed');
      } catch (contractError: any) {
        // ALL validation errors should block the transaction
        console.error('Freighter transaction spending limit validation error:', contractError.message);
        throw new Error(`Transaction blocked by spending limits: ${contractError.message}`);
      }

      try {
        const transaction = StellarSdk.TransactionBuilder.fromXDR(signedTransaction, networkPassphrase);
        const result = await server.submitTransaction(transaction);
        
        // === LOG TRANSACTION AFTER SUCCESSFUL FREIGHTER SEND ===
        try {
          // Log the completed transaction (update spending amounts)
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/stellar/smart-limit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'log_transaction',
              publicKey,
              secretKey: '', // Freighter doesn't provide secret key
              contactAddress: recipient,
              amount: numAmount,
              memo: 'Freighter Wallet Send'
            })
          });
          
          console.log('✅ Freighter transaction logged to smart contract');
        } catch (logError: any) {
          console.warn('Failed to log Freighter transaction:', logError.message);
          // Don't fail the main transaction if logging fails
        }
        
        return NextResponse.json({
          success: true,
          hash: result.hash,
          amount: numAmount,
          recipient: recipient,
          message: `Successfully sent ${amount} XLM to ${recipient}`,
          spendingLimits: 'Transaction validated against spending limits'
        });
      } catch (submitError: any) {
        throw new Error(`Failed to submit signed transaction: ${submitError.message}`);
      }
    }
    
    // For manual connections, require secret key
    if (!secretKey) {
      throw new Error('For manual wallet connections, secret key is required. For Freighter connections, use the signedTransaction parameter.');
    }

    if (!recipient || !amount) {
      throw new Error('Recipient and amount are required');
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

    let sourceKeys;
    try {
      sourceKeys = StellarSdk.Keypair.fromSecret(secretKey);
    } catch (keyError: any) {
      if (keyError.message.includes('invalid version byte')) {
        const networkType = isMainnet ? 'mainnet' : 'testnet';
        const expectedPrefix = isMainnet ? 'S (mainnet)' : 'S (testnet)';
        throw new Error(`Invalid secret key format for ${networkType}. Expected key starting with ${expectedPrefix}. You may be using ${isMainnet ? 'testnet' : 'mainnet'} keys on ${networkType}.`);
      }
      throw new Error(`Invalid secret key: ${keyError.message}`);
    }
    
    // Verify the public key matches the secret key
    if (sourceKeys.publicKey() !== publicKey) {
      throw new Error('Public and secret keys do not match');
    }

    // Check if destination account exists
    try {
      await server.loadAccount(recipient);
    } catch (destError: any) {
      if (destError.response?.status === 404) {
        throw new Error(`The recipient account does not exist on the Stellar network. You can only send XLM to accounts that have been funded at least once. Try using the Stellar Laboratory to create the account first: https://laboratory.stellar.org/#account-creator`);
      }
    }

    // === MANDATORY SPENDING LIMIT VALIDATION ===
    try {
      // Always validate transaction with smart contract (required for spending limits)
      const validateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/stellar/smart-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_transaction',
          publicKey,
          secretKey,
          contactAddress: recipient,
          amount: numAmount,
          memo: 'AI Wallet Transaction'
        })
      });
      
      const validateData = await validateResponse.json();
      
      if (!validateResponse.ok) {
        throw new Error(`Spending limit validation failed: ${validateData.error}`);
      }
      
      // ALWAYS block if the smart contract says no
      if (validateData.isValid === false) {
        const errors = validateData.errors || ['Transaction not allowed by spending limits'];
        throw new Error(`🚫 Transaction blocked: ${errors.join(', ')}`);
      }
      
      console.log('✅ Spending limit validation passed');
    } catch (contractError: any) {
      // ALL validation errors should block the transaction
      console.error('Spending limit validation error:', contractError.message);
      throw new Error(`Transaction blocked by spending limits: ${contractError.message}`);
    }

    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    
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
    
    transaction.sign(sourceKeys);
    const result = await server.submitTransaction(transaction);
    
    // === LOG TRANSACTION AFTER SUCCESSFUL SEND ===
    try {
      // Log the completed transaction (spending was already updated during validation)
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003'}/api/stellar/smart-limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_transaction',
          publicKey,
          secretKey,
          contactAddress: recipient,
          amount: numAmount,
          memo: 'AI Wallet Send'
        })
      });
      
      console.log('✅ Transaction logged to smart contract');
    } catch (logError: any) {
      console.warn('Failed to log transaction:', logError.message);
      // Don't fail the main transaction if logging fails
    }
    
    return NextResponse.json({
      success: true,
      hash: result.hash,
      amount: numAmount,
      recipient: recipient,
      message: `Successfully sent ${numAmount} XLM to ${recipient}`,
      spendingLimits: 'Transaction validated against spending limits'
    });
    
  } catch (error: any) {
    console.error('Transaction error:', error);
    
    let errorMessage = error.message;
    
    // Handle common Stellar errors
    if (error.response?.data?.extras?.result_codes) {
      const codes = error.response.data.extras.result_codes;
      if (codes.transaction === 'tx_failed' && codes.operations?.includes('op_no_destination')) {
        errorMessage = `Recipient account ${recipient} does not exist. In Stellar, you can only send to accounts that have been funded at least once.`;
      } else if (codes.operations?.includes('op_underfunded')) {
        errorMessage = 'Insufficient balance to complete this transaction.';
      } else if (codes.operations?.includes('op_line_full')) {
        errorMessage = 'Recipient account cannot receive more of this asset.';
      } else {
        errorMessage = `Transaction failed: ${codes.transaction || 'Unknown error'}`;
      }
    } else if (errorMessage.includes('destination is invalid')) {
      errorMessage = `The recipient address is not a valid Stellar account. Make sure the address is correct and the account exists.`;
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