// Freighter API methods are available on window.freighter
declare global {
  interface Window {
    freighter?: {
      isConnected: () => Promise<boolean>
      getPublicKey: () => Promise<string>
      signTransaction: (xdr: string, options?: any) => Promise<string>
      isAllowed: () => Promise<boolean>
      setAllowed: () => Promise<void>
    }
    albedo?: {
      publicKey: (params: any) => Promise<{ pubkey: string }>
      tx: (params: { xdr: string }) => Promise<{ signed_envelope_xdr: string }>
    }
  }
}

import { detectFreighter, waitForFreighter, getFreighterAPI } from './freighterDetection'

export interface WalletInfo {
  publicKey: string
  walletType: 'freighter' | 'albedo' | 'manual'
  name: string
}

export class WalletConnectionService {
  
  // Check if Freighter wallet is available
  static async isFreighterAvailable(): Promise<boolean> {
    try {
      // Simple check - just see if the API exists
      return detectFreighter()
    } catch (error) {
      return false
    }
  }

  // Check if Albedo wallet is available
  static isAlbedoAvailable(): boolean {
    return typeof window !== 'undefined' && 'albedo' in window
  }

  // Connect to Freighter wallet
  static async connectFreighter(): Promise<WalletInfo | null> {
    try {
      const freighter = getFreighterAPI()
      if (!freighter) {
        throw new Error('Freighter wallet is not installed')
      }

      // Check if Freighter is allowed to connect
      const isAllowed = await freighter.isAllowed()
      if (!isAllowed) {
        // Request permission
        await freighter.setAllowed()
      }

      const publicKey = await freighter.getPublicKey()
      
      return {
        publicKey,
        walletType: 'freighter',
        name: 'Freighter Wallet'
      }
    } catch (error: any) {
      console.error('Freighter connection error:', error)
      throw new Error(`Failed to connect to Freighter: ${error.message}`)
    }
  }

  // Connect to Albedo wallet
  static async connectAlbedo(): Promise<WalletInfo | null> {
    try {
      if (!this.isAlbedoAvailable()) {
        throw new Error('Albedo wallet is not available')
      }

      // @ts-ignore - Albedo types
      const result = await window.albedo.publicKey({})
      
      if (result.pubkey) {
        return {
          publicKey: result.pubkey,
          walletType: 'albedo',
          name: 'Albedo Wallet'
        }
      } else {
        throw new Error('Failed to get public key from Albedo')
      }
    } catch (error: any) {
      console.error('Albedo connection error:', error)
      throw new Error(`Failed to connect to Albedo: ${error.message}`)
    }
  }

  // Get available wallets
  static async getAvailableWallets(): Promise<Array<{
    type: string
    name: string
    icon: string
    available: boolean
    description: string
  }>> {
    const wallets = [
      {
        type: 'freighter',
        name: 'Freighter',
        icon: '🚀',
        available: await this.isFreighterAvailable(),
        description: 'Browser extension wallet for Stellar'
      },
      {
        type: 'albedo',
        name: 'Albedo',
        icon: '⭐',
        available: this.isAlbedoAvailable(),
        description: 'Web-based Stellar wallet'
      },
      {
        type: 'manual',
        name: 'Manual Entry',
        icon: '🔑',
        available: true,
        description: 'Enter your keys manually'
      }
    ]

    return wallets
  }

  // Connect to specified wallet type
  static async connectWallet(walletType: string): Promise<WalletInfo | null> {
    switch (walletType) {
      case 'freighter':
        return await this.connectFreighter()
      case 'albedo':
        return await this.connectAlbedo()
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`)
    }
  }

  // Sign transaction with connected wallet
  static async signTransaction(transaction: string, walletType: 'freighter' | 'albedo'): Promise<string> {
    switch (walletType) {
      case 'freighter':
        const freighter = getFreighterAPI()
        if (!freighter) {
          throw new Error('Freighter wallet not available')
        }
        return await freighter.signTransaction(transaction, { 
          networkPassphrase: 'Test SDF Network ; September 2015' 
        })
      case 'albedo':
        if (!window.albedo) {
          throw new Error('Albedo wallet not available')
        }
        const result = await window.albedo.tx({ xdr: transaction })
        return result.signed_envelope_xdr
      default:
        throw new Error(`Cannot sign with wallet type: ${walletType}`)
    }
  }
}

