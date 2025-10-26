'use client'

import { useState, useEffect } from 'react'
import { useAppContext } from '@/contexts/AppContext'
import WalletLoginForm from './WalletLoginForm'

export default function WalletHeader() {
  const { state, updateWalletKeys, updateBalance, resetState } = useAppContext()
  const { publicKey, secretKey, balance } = state
  const [loading, setLoading] = useState(false)
  const [connectedWalletName, setConnectedWalletName] = useState('')

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
        updateBalance(data.balance)
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()
    
    // Load connected wallet info
    const walletName = localStorage.getItem('connectedWalletName')
    if (walletName) {
      setConnectedWalletName(walletName)
    }
  }, [publicKey])

  const handleDisconnect = () => {
    resetState()
    setConnectedWalletName('')
    localStorage.removeItem('connectedWalletType')
    localStorage.removeItem('connectedWalletName')
  }

  const isLoginPage = !publicKey

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

        {isLoginPage ? (
          <div className="max-w-3xl mx-auto">
            <WalletLoginForm />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/20 p-4 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-1">Connected Wallet</p>
                    <p className="text-lg font-bold text-white">
                      {connectedWalletName || 'Manual Entry'}
                    </p>
                  </div>
                  <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    🔗
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

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