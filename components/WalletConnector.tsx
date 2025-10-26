'use client'

import { useState, useEffect } from 'react'
import { WalletConnectionService, WalletInfo } from '@/lib/walletConnection'
import { useAppContext } from '@/contexts/AppContext'
import WalletInstructions from './WalletInstructions'
import FreighterInstallGuide from './FreighterInstallGuide'

interface WalletOption {
  type: string
  name: string
  icon: string
  available: boolean
  description: string
}

export default function WalletConnector() {
  const { updateWalletKeys } = useAppContext()
  const [availableWallets, setAvailableWallets] = useState<WalletOption[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualPublicKey, setManualPublicKey] = useState('')
  const [manualSecretKey, setManualSecretKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAvailableWallets()
  }, [])

  const loadAvailableWallets = async () => {
    try {
      const wallets = await WalletConnectionService.getAvailableWallets()
      setAvailableWallets(wallets)
    } catch (error) {
      console.error('Failed to load available wallets:', error)
    }
  }

  const handleWalletConnect = async (walletType: string) => {
    if (walletType === 'manual') {
      setShowManualEntry(true)
      return
    }

    setConnecting(walletType)
    setError(null)

    try {
      const walletInfo = await WalletConnectionService.connectWallet(walletType)
      
      if (walletInfo) {
        // For browser wallets, we only get the public key
        // We'll need to handle signing differently for transactions
        updateWalletKeys(walletInfo.publicKey, '')
        
        // Store wallet type for future transaction signing
        localStorage.setItem('connectedWalletType', walletInfo.walletType)
        localStorage.setItem('connectedWalletName', walletInfo.name)
      }
    } catch (error: any) {
      setError(error.message)
      
      // If wallet connection fails, show installation instructions
      if (walletType === 'freighter') {
        if (error.message.includes('not installed')) {
          setError('Freighter wallet extension not found. Please install it from the Chrome Web Store and refresh this page.')
        } else if (error.message.includes('User declined access')) {
          setError('Connection cancelled. Please try again and approve the connection request.')
        } else {
          setError(`Freighter connection failed: ${error.message}`)
        }
      } else if (walletType === 'albedo' && error.message.includes('not available')) {
        setError('Albedo wallet not available. Please visit albedo.link to use Albedo.')
      }
    } finally {
      setConnecting(null)
    }
  }

  const handleManualConnect = () => {
    if (!manualPublicKey || !manualSecretKey) {
      setError('Please enter both public and secret keys')
      return
    }

    // Basic validation
    if (!manualPublicKey.startsWith('G') || manualPublicKey.length !== 56) {
      setError('Invalid public key format. Public keys should start with "G" and be 56 characters long.')
      return
    }
    
    if (!manualSecretKey.startsWith('S') || manualSecretKey.length !== 56) {
      setError('Invalid secret key format. Secret keys should start with "S" and be 56 characters long.')
      return
    }

    updateWalletKeys(manualPublicKey, manualSecretKey)
    localStorage.setItem('connectedWalletType', 'manual')
    localStorage.setItem('connectedWalletName', 'Manual Entry')
  }

  const generateTestnetKeys = async () => {
    try {
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        setManualPublicKey(data.publicKey)
        setManualSecretKey(data.secretKey)
      } else {
        // Fallback to working demo keys
        setManualPublicKey('GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3')
        setManualSecretKey('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
      }
    } catch (error) {
      // Fallback to working demo keys
      setManualPublicKey('GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3')
      setManualSecretKey('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
    }
  }

  if (showManualEntry) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={() => setShowManualEntry(false)}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Back to wallet options
          </button>
          <h3 className="text-xl font-bold text-white mb-2">Manual Key Entry</h3>
          <p className="text-gray-400">Enter your Stellar testnet keys manually</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-lg">🔑</span>
              Public Key
            </label>
            <input
              type="text"
              value={manualPublicKey}
              onChange={(e) => setManualPublicKey(e.target.value)}
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="kiro-input text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-lg">🔐</span>
              Secret Key
            </label>
            <input
              type="password"
              value={manualSecretKey}
              onChange={(e) => setManualSecretKey(e.target.value)}
              placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              className="kiro-input text-sm font-mono"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleManualConnect}
            disabled={!manualPublicKey || !manualSecretKey}
            className="flex-1 kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
          >
            <span className="mr-2">🚀</span>
            Connect Wallet
          </button>
          <button
            onClick={generateTestnetKeys}
            className="kiro-btn kiro-btn-ghost hover:scale-105 transition-transform duration-300"
          >
            <span className="mr-2">🔑</span>
            Generate Keys
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">Choose how you'd like to connect to the Stellar network</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300">
          <div className="flex items-center gap-2 mb-2">
            <span>⚠️</span>
            <span className="font-semibold">Connection Error</span>
          </div>
          <p>{error}</p>
          {error.includes('Freighter') && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <a
                  href="https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  Install Freighter →
                </a>
                <button
                  onClick={async () => {
                    setError(null)
                    const { triggerFreighterInjection } = await import('@/lib/freighterDetection')
                    const detected = await triggerFreighterInjection()
                    if (detected) {
                      loadAvailableWallets()
                      setError('Freighter detected! Please try connecting again.')
                    } else {
                      setError('Still unable to detect Freighter. Make sure it\'s installed and enabled.')
                    }
                  }}
                  className="text-orange-400 hover:text-orange-300 underline text-sm"
                >
                  Force Detect
                </button>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>If Freighter is installed but not detected:</p>
                <p>• Click "Force Detect" above</p>
                <p>• Open the Freighter extension once</p>
                <p>• Refresh this page</p>
                <p>• Make sure the extension is enabled</p>
              </div>
            </div>
          )}
          {error.includes('Albedo') && (
            <a
              href="https://albedo.link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-blue-400 hover:text-blue-300 underline"
            >
              Open Albedo Wallet →
            </a>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {availableWallets.map((wallet) => (
          <button
            key={wallet.type}
            onClick={() => handleWalletConnect(wallet.type)}
            disabled={!wallet.available || connecting === wallet.type}
            className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-105 ${
              wallet.available
                ? 'bg-gradient-to-r from-white/10 to-black/10 border-white/20 hover:border-white/40'
                : 'bg-gradient-to-r from-white/5 to-black/5 border-white/10 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{wallet.icon}</div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-white">{wallet.name}</h4>
                  {!wallet.available && wallet.type !== 'manual' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                      Not Available
                    </span>
                  )}
                  {connecting === wallet.type && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 animate-pulse">
                      Connecting...
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{wallet.description}</p>
              </div>
              <div className="text-white/60">
                {connecting === wallet.type ? '⏳' : '→'}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Show install guide if no wallets are available */}
      {availableWallets.length > 0 && !availableWallets.some(w => w.available && w.type !== 'manual') && (
        <FreighterInstallGuide />
      )}
      
      <WalletInstructions />
    </div>
  )
}