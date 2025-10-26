'use client'

import { useState, useEffect } from 'react'
import FreighterLogin from './FreighterLogin'
import { freighterWallet } from '@/lib/freighterWallet'
import { useAppContext } from '@/contexts/AppContext'

export default function FreighterWalletConnector() {
  const { updateWalletKeys } = useAppContext()
  const [showFreighterLogin, setShowFreighterLogin] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [freighterAvailable, setFreighterAvailable] = useState(false)
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Freighter is available
    const checkFreighter = async () => {
      const available = await freighterWallet.isAvailable()
      setFreighterAvailable(available)
    }
    
    checkFreighter()
    
    // Check periodically for Freighter installation
    const interval = setInterval(checkFreighter, 3000)
    return () => clearInterval(interval)
  }, [])

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

  const connectManual = () => {
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

  const quickStart = async () => {
    await generateKeys()
    // Auto-connect after generating
    setTimeout(() => {
      if (publicKey && secretKey) {
        updateWalletKeys(publicKey, secretKey)
        localStorage.setItem('connectedWalletType', 'manual')
        localStorage.setItem('connectedWalletName', 'Generated Keys')
      }
    }, 100)
  }

  // If showing Freighter login
  if (showFreighterLogin) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <button
            onClick={() => setShowFreighterLogin(false)}
            className="text-gray-400 hover:text-white transition-colors mb-4"
          >
            ← Back to wallet options
          </button>
        </div>
        <FreighterLogin />
      </div>
    )
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
            <span className="font-semibold">Error</span>
          </div>
          <p>{error}</p>
        </div>
      )}

      {/* Connection Options */}
      <div className="grid gap-4">
        {/* Freighter Option */}
        <button
          onClick={() => setShowFreighterLogin(true)}
          className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 bg-gradient-to-r from-white/10 to-black/10 border-white/20 hover:border-white/40"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-semibold text-white">Freighter Wallet</h4>
                {freighterAvailable ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                    Available
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300">
                    Install Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {freighterAvailable 
                  ? 'Secure browser extension wallet (Recommended)'
                  : 'Install Freighter extension for secure wallet access'
                }
              </p>
            </div>
            <div className="text-white/60">→</div>
          </div>
        </button>

        {/* Quick Start Option */}
        <button
          onClick={quickStart}
          className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30 hover:border-green-400/50"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚡</div>
            <div className="flex-1 text-left">
              <h4 className="text-lg font-semibold text-white">Quick Start</h4>
              <p className="text-sm text-gray-400">
                Generate new testnet keys and connect instantly
              </p>
            </div>
            <div className="text-white/60">→</div>
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
                Enter your own keys or generate new ones
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
              onClick={connectManual}
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
              Generate Keys
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="text-center">
        <div className="kiro-card p-6">
          <h4 className="text-lg font-semibold text-white mb-3">🧪 Testnet Environment</h4>
          <p className="text-gray-300 mb-4">
            This application uses Stellar's testnet for safe development and testing. 
            All transactions use test XLM with no real value.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p><strong>Freighter:</strong> Most secure option</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <p><strong>Quick Start:</strong> Fastest setup</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔑</div>
              <p><strong>Manual:</strong> Full control</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}