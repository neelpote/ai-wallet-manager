import { freighterWallet } from './freighterWallet'
import * as StellarSdk from '@stellar/stellar-sdk'

export class TransactionSigner {
  
  static async signAndSubmitTransaction(
    transaction: StellarSdk.Transaction,
    secretKey?: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const walletType = localStorage.getItem('connectedWalletType') as 'freighter' | 'manual'
      
      if (walletType === 'manual' && secretKey) {
        // Sign with secret key for manual entry
        const keypair = StellarSdk.Keypair.fromSecret(secretKey)
        transaction.sign(keypair)
      } else if (walletType === 'freighter') {
        // Sign with Freighter wallet
        const xdr = transaction.toXDR()
        const result = await freighterWallet.signTransaction(xdr)
        
        if (!result.success) {
          throw new Error(result.error || 'Freighter signing failed')
        }
        
        transaction = StellarSdk.TransactionBuilder.fromXDR(result.signedXdr!, StellarSdk.Networks.TESTNET)
      } else {
        throw new Error('No valid signing method available')
      }

      // Submit to Stellar network
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
      const result = await server.submitTransaction(transaction)
      
      return {
        success: true,
        hash: result.hash
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Transaction failed'
      }
    }
  }

  static async createAndSignPayment(
    sourcePublicKey: string,
    destinationPublicKey: string,
    amount: string,
    secretKey?: string
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
      const sourceAccount = await server.loadAccount(sourcePublicKey)
      
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          })
        )
        .setTimeout(30)
        .build()

      return await this.signAndSubmitTransaction(transaction, secretKey)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create payment'
      }
    }
  }

  static getWalletType(): string | null {
    return localStorage.getItem('connectedWalletType')
  }

  static requiresSecretKey(): boolean {
    const walletType = this.getWalletType()
    return walletType === 'manual'
  }
}