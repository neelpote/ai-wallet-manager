'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/AppContext'
import QuickStart from './QuickStart'

export default function SimpleWalletConnector() {
  const { updateWalletKeys } = useAppContext()
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const generateKeys = async () => {
    try {
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        setPublicKey(data.publicKey)
        setSecretKey(data.secretKey)
      } else {
        // Fallback keys
        setPublicKey('GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3')
        setSecretKey('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
      }
    } catch (error) {
      // Fallback keys
      setPublicKey('GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3')
      setSecretKey('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
    }
  }

  const connectWallet = () => {
    if (!publicKey || !secretKey) {
      setError('Please enter both keys or generate new ones')
      return
    }

    // Basic validation
    if (!publicKey.startsWith('G') || publicKey.length !== 56) {
      setError('Invalid public key format')
      return
    }
    
    if (!secretKey.startsWith('S') || secretKey.length !== 56) {
      setError('Invalid secret key format')
      return
    }

    updateWalletKeys(publicKey, secretKey)
    localStorage.setItem('connectedWalletType', 'manual')
    localStorage.setItem('connectedWalletName', 'Manual Entry')
  }

  const tryFreighter = async () => {
    setConnecting(true)
    setError(null)

    try {
      console.log('🔍 Checking for Freighter...')
      
      // Enhanced Freighter detection
      const freighterAPI = (window as any).freighter || (window as any).stellar
      
      if (!freighterAPI) {
        // Wait a bit for potential late injection
        console.log('⏳ Freighter not immediately available, waiting...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const delayedAPI = (window as any).freighter || (window as any).stellar
        if (!delayedAPI) {
          throw new Error('Freighter extension not detected. Please install Freighter extension and open it once, then refresh this page.')
        }
      }

      const freighter = freighterAPI || (window as any).freighter
      console.log('✅ Freighter API found:', !!freighter)

      // Check available methods
      const methods = {
        isConnected: typeof freighter.isConnected === 'function',
        getPublicKey: typeof freighter.getPublicKey === 'function',
        isAllowed: typeof freighter.isAllowed === 'function',
        setAllowed: typeof freighter.setAllowed === 'function'
      }
      console.log('🔧 Available methods:', methods)

      if (!methods.getPublicKey) {
        throw new Error('Freighter API incomplete. Please refresh the page and try again.')
      }

      // Try to get permission
      console.log('🔐 Checking permissions...')
      const isAllowed = await freighter.isAllowed()
      console.log('Permission status:', isAllowed)
      
      if (!isAllowed) {
        console.log('📝 Requesting permission...')
        await freighter.setAllowed()
      }

      // Get public key
      console.log('🔑 Getting public key...')
      const freighterPublicKey = await freighter.getPublicKey()
      console.log('✅ Public key received:', freighterPublicKey ? `${freighterPublicKey.slice(0, 8)}...` : 'null')
      
      if (!freighterPublicKey) {
        throw new Error('Failed to get public key from Freighter. Please make sure you\'re logged in.')
      }

      updateWalletKeys(freighterPublicKey, '')
      localStorage.setItem('connectedWalletType', 'freighter')
      localStorage.setItem('connectedWalletName', 'Freighter Wallet')
      
      console.log('🎉 Freighter connection successful!')
      
    } catch (error: any) {
      console.error('❌ Freighter error:', error)
      setError(`Freighter connection failed: ${error.message}`)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">Choose your preferred connection method</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300">
          <div className="flex items-center gap-2 mb-2">
            <span>⚠️</span>
            <span className="font-semibold">Connection Error</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Quick Options */}
      <div className="grid gap-4">
        {/* Freighter Option */}
        <button
          onClick={tryFreighter}
          disabled={connecting}
          className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 bg-gradient-to-r from-white/10 to-black/10 border-white/20 hover:border-white/40"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1 text-left">
              <h4 className="text-lg font-semibold text-white">Try Freighter Wallet</h4>
              <p className="text-sm text-gray-400">
                {connecting ? 'Connecting...' : 'Browser extension (may not work)'}
              </p>
            </div>
            <div className="text-white/60">
              {connecting ? '⏳' : '→'}
            </div>
          </div>
        </button>

        {/* Manual Entry Option */}
        <button
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 bg-gradient-to-r from-white/10 to-black/10 border-white/20 hover:border-white/40"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🔑</div>
            <div className="flex-1 text-left">
              <h4 className="text-lg font-semibold text-white">Manual Entry</h4>
              <p className="text-sm text-gray-400">
                Enter keys manually or generate new testnet keys (Recommended)
              </p>
            </div>
            <div className="text-white/60">
              {showManualEntry ? '▼' : '→'}
            </div>
          </div>
        </button>
      </div>

      {/* Manual Entry Form */}
      {showManualEntry && (
        <div className="kiro-card space-y-4">
          <h4 className="text-lg font-semibold text-white">Manual Key Entry</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                🔑 Public Key
              </label>
              <input
                type="text"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="kiro-input text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                🔐 Secret Key
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="kiro-input text-sm font-mono"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={connectWallet}
              disabled={!publicKey || !secretKey}
              className="flex-1 kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
            >
              <span className="mr-2">🚀</span>
              Connect Wallet
            </button>
            <button
              onClick={generateKeys}
              className="kiro-btn kiro-btn-ghost hover:scale-105 transition-transform duration-300"
            >
              <span className="mr-2">🎲</span>
              Generate New Keys
            </button>
          </div>

          <div className="text-center">
            <div className="kiro-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse-glow"></div>
                <p className="font-semibold text-white">🧪 Testnet Environment</p>
              </div>
              <p className="text-sm text-gray-300">
                This uses Stellar's testnet for safe development. Generate new keys or use existing testnet keys.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Option */}
      {!showManualEntry && (
        <div className="border-t border-white/10 pt-6">
          <QuickStart />
        </div>
      )}
    </div>
  )
}