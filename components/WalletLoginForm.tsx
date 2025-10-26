'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/AppContext'
import { connectWallet as connectFreighterWallet, isWalletInstalled } from '@/lib/freighterWallet'


export default function WalletLoginForm() {
  const { updateWalletKeys } = useAppContext()
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false);

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
    setError(null)
    
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
    setConnecting(true)
    
    try {
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        // Immediately connect with the generated keys
        updateWalletKeys(data.publicKey, data.secretKey)
        localStorage.setItem('connectedWalletType', 'manual')
        localStorage.setItem('connectedWalletName', 'Generated Keys')
      } else {
        throw new Error('Failed to generate keys')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate keys')
    } finally {
      setConnecting(false)
    }
  }

  const tryFreighter = async () => {
    setConnecting(true)
    setError(null)

    try {
      // Check if Freighter is installed
      const installed = await isWalletInstalled()
      if (!installed) {
        throw new Error('Freighter extension not found. Please install Freighter extension and open it once.')
      }

      // Use our improved connection function
      const freighterPublicKey = await connectFreighterWallet()
      
      if (freighterPublicKey) {
        updateWalletKeys(freighterPublicKey, '')
        localStorage.setItem('connectedWalletType', 'freighter')
        localStorage.setItem('connectedWalletName', 'Freighter Wallet')
      } else {
        throw new Error('Failed to connect to Freighter wallet. Please try again.')
      }
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h3>
        <p className="text-xl text-gray-400">Choose how you'd like to connect to Stellar testnet</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 text-center">
          <p>{error}</p>
        </div>
      )}

      {/* Connection Options */}
      <div className="grid gap-6">
        {/* Quick Start - Most Prominent */}
        <button
          onClick={quickStart}
          disabled={connecting}
          className="p-8 rounded-2xl border transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30 hover:border-green-400/50"
        >
          <div className="text-center">
            <div className="text-5xl mb-4">⚡</div>
            <h4 className="text-2xl font-bold text-white mb-2">Quick Start</h4>
            <p className="text-gray-400 mb-4">
              Generate new testnet keys and connect instantly
            </p>
            {connecting ? (
              <div className="text-green-400">Generating keys...</div>
            ) : (
              <div className="text-green-400 font-semibold">Recommended for testing</div>
            )}
          </div>
        </button>

        {/* Freighter Option */}
        <button
          onClick={tryFreighter}
          disabled={connecting}
          className="p-6 rounded-2xl border transition-all duration-300 hover:scale-105 bg-gradient-to-r from-white/10 to-black/10 border-white/20 hover:border-white/40"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🚀</div>
            <div className="flex-1 text-left">
              <h4 className="text-xl font-semibold text-white">Freighter Wallet</h4>
              <p className="text-gray-400">
                {connecting ? 'Connecting...' : 'Secure browser extension wallet'}
              </p>
            </div>
            <div className="text-white/60">
              {connecting ? '⏳' : '→'}
            </div>
          </div>
        </button>

        {/* Manual Entry */}
        <div className="kiro-card space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h4 className="text-xl font-semibold text-white mb-2">Manual Entry</h4>
            <p className="text-gray-400">Enter your Stellar testnet keys</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Public Key
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
                Secret Key
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
              disabled={!publicKey || !secretKey || connecting}
              className="flex-1 kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
            >
              <span className="mr-2">🚀</span>
              Connect Wallet
            </button>
            <button
              onClick={generateKeys}
              disabled={connecting}
              className="kiro-btn kiro-btn-ghost hover:scale-105 transition-transform duration-300"
            >
              <span className="mr-2">🎲</span>
              Generate Keys
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="text-center">
        <div className="kiro-card p-6">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse-glow"></div>
            <p className="font-semibold text-white">🧪 Testnet Environment</p>
          </div>
          <p className="text-gray-300">
            This application uses Stellar's testnet for safe development and testing. 
            All transactions use test XLM with no real value.
          </p>
        </div>
      </div>
    </div>
  )
}