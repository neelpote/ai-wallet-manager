// Comprehensive Freighter Wallet Integration
export interface FreighterWallet {
  isConnected(): Promise<boolean>
  getPublicKey(): Promise<string>
  signTransaction(xdr: string, options?: any): Promise<string>
  isAllowed(): Promise<boolean>
  setAllowed(): Promise<void>
  getNetwork(): Promise<string>
  signAuthEntry(entryXdr: string, options?: any): Promise<string>
}

export class FreighterWalletService {
  private static instance: FreighterWalletService
  private freighter: FreighterWallet | null = null
  private isInitialized = false

  static getInstance(): FreighterWalletService {
    if (!FreighterWalletService.instance) {
      FreighterWalletService.instance = new FreighterWalletService()
    }
    return FreighterWalletService.instance
  }

  // Initialize Freighter connection
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return !!this.freighter

    try {
      // Wait for Freighter to be available
      const freighter = await this.waitForFreighter()
      if (!freighter) return false

      this.freighter = freighter
      this.isInitialized = true
      return true
    } catch (error) {
      console.error('Freighter initialization failed:', error)
      return false
    }
  }

  // Wait for Freighter to be injected into the page
  private waitForFreighter(timeout = 10000): Promise<FreighterWallet | null> {
    return new Promise((resolve) => {
      // Check if already available
      if ((window as any).freighter) {
        resolve((window as any).freighter)
        return
      }

      let attempts = 0
      const maxAttempts = timeout / 100

      const checkInterval = setInterval(() => {
        attempts++

        if ((window as any).freighter) {
          clearInterval(checkInterval)
          resolve((window as any).freighter)
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          resolve(null)
        }
      }, 100)

      // Also listen for potential injection events
      const handleFreighterReady = () => {
        if ((window as any).freighter) {
          clearInterval(checkInterval)
          window.removeEventListener('freighter-ready', handleFreighterReady)
          resolve((window as any).freighter)
        }
      }

      window.addEventListener('freighter-ready', handleFreighterReady)
      
      // Dispatch event to potentially trigger injection
      window.dispatchEvent(new CustomEvent('freighter-detection'))
    })
  }

  // Check if Freighter is available
  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize()
    }
    return !!this.freighter
  }

  // Connect to Freighter wallet
  async connect(): Promise<{ success: boolean; publicKey?: string; error?: string }> {
    try {
      if (!await this.isAvailable()) {
        return {
          success: false,
          error: 'Freighter wallet not available. Please install the Freighter extension.'
        }
      }

      if (!this.freighter) {
        return {
          success: false,
          error: 'Freighter not initialized properly.'
        }
      }

      // Check if already allowed
      const isAllowed = await this.freighter.isAllowed()
      
      if (!isAllowed) {
        // Request permission
        try {
          await this.freighter.setAllowed()
        } catch (error: any) {
          if (error.message?.includes('User declined access')) {
            return {
              success: false,
              error: 'Connection cancelled. Please approve the connection request to continue.'
            }
          }
          throw error
        }
      }

      // Get public key
      const publicKey = await this.freighter.getPublicKey()
      
      if (!publicKey) {
        return {
          success: false,
          error: 'Failed to get public key. Please make sure you are logged into Freighter.'
        }
      }

      // Verify we're on testnet
      try {
        const network = await this.freighter.getNetwork()
        if (network !== 'TESTNET') {
          return {
            success: false,
            error: 'Please switch to Testnet in your Freighter wallet settings.'
          }
        }
      } catch (error) {
        // Network check failed, but continue anyway
        console.warn('Could not verify network, continuing anyway:', error)
      }

      return {
        success: true,
        publicKey
      }

    } catch (error: any) {
      console.error('Freighter connection error:', error)
      
      let errorMessage = 'Connection failed: ' + error.message

      // Handle specific error types
      if (error.message?.includes('User declined access')) {
        errorMessage = 'Connection cancelled. Please try again and approve the request.'
      } else if (error.message?.includes('not logged in')) {
        errorMessage = 'Please log into your Freighter wallet and try again.'
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your Freighter settings and try again.'
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Sign a transaction
  async signTransaction(xdr: string): Promise<{ success: boolean; signedXdr?: string; error?: string }> {
    try {
      if (!this.freighter) {
        return {
          success: false,
          error: 'Freighter not connected. Please connect first.'
        }
      }

      const signedXdr = await this.freighter.signTransaction(xdr, {
        networkPassphrase: 'Test SDF Network ; September 2015'
      })

      return {
        success: true,
        signedXdr
      }

    } catch (error: any) {
      console.error('Transaction signing error:', error)
      
      let errorMessage = 'Signing failed: ' + error.message

      if (error.message?.includes('User declined')) {
        errorMessage = 'Transaction cancelled by user.'
      } else if (error.message?.includes('not allowed')) {
        errorMessage = 'Permission denied. Please reconnect your wallet.'
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  // Get connection status
  async getStatus(): Promise<{
    available: boolean
    connected: boolean
    allowed: boolean
    publicKey?: string
    network?: string
  }> {
    const status = {
      available: false,
      connected: false,
      allowed: false,
      publicKey: undefined as string | undefined,
      network: undefined as string | undefined
    }

    try {
      status.available = await this.isAvailable()
      
      if (status.available && this.freighter) {
        status.connected = await this.freighter.isConnected()
        status.allowed = await this.freighter.isAllowed()
        
        if (status.allowed) {
          try {
            status.publicKey = await this.freighter.getPublicKey()
            status.network = await this.freighter.getNetwork()
          } catch (error) {
            // Ignore errors for optional info
          }
        }
      }
    } catch (error) {
      console.error('Status check error:', error)
    }

    return status
  }

  // Disconnect (clear local state)
  disconnect(): void {
    this.freighter = null
    this.isInitialized = false
  }
}

// Global instance
export const freighterWallet = FreighterWalletService.getInstance()

// Utility functions
export const detectFreighterInstallation = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).freighter
}

export const getFreighterInstallUrl = (): string => {
  return 'https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk'
}