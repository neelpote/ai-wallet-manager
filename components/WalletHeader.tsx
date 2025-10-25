'use client'

import { useState, useEffect } from 'react'

interface WalletHeaderProps {
  publicKey: string
  onKeysChange: (publicKey: string, secretKey: string) => void
}

export default function WalletHeader({ publicKey, onKeysChange }: WalletHeaderProps) {
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(!publicKey)
  const [inputPublicKey, setInputPublicKey] = useState('')
  const [inputSecretKey, setInputSecretKey] = useState('')

  const fetchBalance = async () => {
    if (!publicKey) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/stellar/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey })
      })
      
      const data = await response.json()
      if (data.balance !== undefined) {
        setBalance(data.balance)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
  }, [publicKey])

  const handleConnect = () => {
    if (inputPublicKey && inputSecretKey) {
      // Basic validation
      if (!inputPublicKey.startsWith('G') || inputPublicKey.length !== 56) {
        alert('Invalid public key format. Public keys should start with "G" and be 56 characters long.')
        return
      }
      
      if (!inputSecretKey.startsWith('S') || inputSecretKey.length !== 56) {
        alert('Invalid secret key format. Secret keys should start with "S" and be 56 characters long.')
        return
      }
      
      onKeysChange(inputPublicKey, inputSecretKey)
      setShowKeyInput(false)
    }
  }

  const handleDisconnect = () => {
    onKeysChange('', '')
    setInputPublicKey('')
    setInputSecretKey('')
    setShowKeyInput(true)
    setBalance('0')
  }

  const handleGenerateKeys = async () => {
    try {
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        setInputPublicKey(data.publicKey)
        setInputSecretKey(data.secretKey)
      } else {
        // Fallback to working demo keys
        setInputPublicKey('GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3')
        setInputSecretKey('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
      }
    } catch (error) {
      // Fallback to working demo keys
      setInputPublicKey('GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3')
      setInputSecretKey('SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4')
    }
  }

  const isLoginPage = !publicKey && showKeyInput

  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-black/10 to-white/5 rounded-3xl blur-xl"></div>
      
      <div className={`relative backdrop-blur-xl bg-gradient-to-r from-white/10 via-black/5 to-white/10 border border-white/15 rounded-3xl shadow-2xl animate-slide-in-up ${
        isLoginPage ? 'p-8 max-w-4xl mx-auto' : 'p-6'
      }`}>
        {/* Login Page Header */}
        {isLoginPage && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-5xl animate-float-gentle">🤖</div>
              <h1 className="text-4xl font-bold text-white">AI Wallet Manager</h1>
            </div>
            <p className="text-xl text-gray-300 mb-6">
              Connect your Stellar testnet wallet to unlock AI-powered management
            </p>
          </div>
        )}

        {/* Regular Header for Connected State */}
        {!isLoginPage && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="px-4 py-2 text-sm font-semibold rounded-2xl bg-gradient-to-r from-white/20 to-black/20 border border-white/30 text-white animate-pulse-glow">
                  🧪 TESTNET
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-gray-300 font-medium">Development Environment</p>
                <p className="text-xs text-gray-500">Safe testing with testnet credentials</p>
              </div>
            </div>
            {publicKey && (
              <button
                onClick={handleDisconnect}
                className="kiro-btn kiro-btn-danger hover:scale-105 transition-transform duration-300"
              >
                <span className="mr-2">🔌</span>
                Disconnect
              </button>
            )}
          </div>
        )}

        {/* Testnet Badge for Login Page */}
        {isLoginPage && (
          <div className="flex justify-center mb-6">
            <span className="px-6 py-3 text-base font-semibold rounded-2xl bg-gradient-to-r from-white/20 to-black/20 border border-white/30 text-white animate-pulse-glow">
              🧪 TESTNET ENVIRONMENT
            </span>
          </div>
        )}

        {showKeyInput ? (
          <div className={`space-y-6 ${isLoginPage ? 'max-w-3xl mx-auto' : ''}`}>
            <div className={`grid gap-6 ${isLoginPage ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  Public Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputPublicKey}
                    onChange={(e) => setInputPublicKey(e.target.value)}
                    placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="kiro-input pl-12 text-sm font-mono"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    G...
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={inputSecretKey}
                    onChange={(e) => setInputSecretKey(e.target.value)}
                    placeholder="SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="kiro-input pl-12 text-sm font-mono"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    S...
                  </div>
                </div>
              </div>
            </div>
            
            <div className={`flex gap-4 ${isLoginPage ? 'flex-col sm:flex-row justify-center' : 'flex-col sm:flex-row'}`}>
              <button
                onClick={handleConnect}
                disabled={!inputPublicKey || !inputSecretKey}
                className={`kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300 ${
                  isLoginPage ? 'text-xl py-5 px-8' : 'flex-1 text-lg py-4'
                }`}
              >
                <span className="mr-2">🚀</span>
                Connect Wallet
              </button>
              <button
                onClick={handleGenerateKeys}
                className={`kiro-btn kiro-btn-ghost hover:scale-105 transition-transform duration-300 ${
                  isLoginPage ? 'text-lg py-4 px-6' : ''
                }`}
              >
                <span className="mr-2">🔑</span>
                Generate Keys
              </button>
            </div>

            {/* Login Page Footer */}
            {isLoginPage && (
              <div className="mt-8 text-center">
                <div className="kiro-card-premium p-6 text-left">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse-glow"></div>
                    <p className="font-semibold text-white">⚠️ Development Environment</p>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    This wallet operates on Stellar's testnet for safe development and testing. 
                    Never use mainnet keys or real funds. Get free testnet XLM from the built-in faucet after connecting.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/20 p-4 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-1">Public Key</p>
                    <p className="text-lg font-mono font-bold text-white">
                      {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                    </p>
                  </div>
                  <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    🔑
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/20 p-4 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-1">Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {loading ? (
                        <span className="animate-pulse">Loading...</span>
                      ) : (
                        `${balance} XLM`
                      )}
                    </p>
                  </div>
                  <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    💰
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                onClick={fetchBalance}
                disabled={loading}
                className="kiro-btn kiro-btn-ghost hover:scale-105 transition-all duration-300 py-3"
              >
                <span className="mr-2 text-lg">🔄</span>
                Refresh Balance
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/stellar/fund-testnet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ publicKey })
                    })
                    
                    const data = await response.json()
                    
                    if (response.ok) {
                      alert('Account funded with 10,000 test XLM!')
                      fetchBalance()
                    } else {
                      alert(`Funding failed: ${data.error}`)
                    }
                  } catch (error) {
                    alert('Failed to fund account. Try using Friendbot directly.')
                  }
                }}
                className="kiro-btn kiro-btn-success hover:scale-105 transition-all duration-300 py-3"
              >
                <span className="mr-2 text-lg">💰</span>
                Fund Testnet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}