'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '../ChatInterface'
import MultiAssetPortfolio from '../MultiAssetPortfolio'
import { useAppContext } from '@/contexts/AppContext'
import ContractStatus from '@/components/ContractStatus'

export default function Dashboard() {
  const { state, updateBalance, updateSpendingInfo } = useAppContext()
  const { publicKey, secretKey, balance, spendingInfo } = state
  const [loading, setLoading] = useState(false)

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

  const fetchSpendingInfo = async () => {
    try {
      const response = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_spending_info',
          publicKey,
          secretKey
        })
      })
      
      const data = await response.json()
      if (response.ok && data.spendingInfo) {
        updateSpendingInfo(data.spendingInfo)
      }
    } catch (error) {
      console.error('Error fetching spending info:', error)
    }
  }

  useEffect(() => {
    if (publicKey) {
      fetchBalance()
      fetchSpendingInfo()
    }
  }, [publicKey])

  return (
    <div className="space-y-8">
      {/* Multi-Asset Portfolio - NEW FIRST */}
      <div className="mb-8">
        <div className="relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue/10 via-purple/15 to-blue/10 rounded-3xl blur-2xl"></div>
          <div className="relative">
            <MultiAssetPortfolio />
          </div>
        </div>
      </div>

      {/* AI Chat Interface - Full Width & Prominent - NOW SECOND */}
      <div className="mb-8">
        <div className="relative">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-black/15 to-white/10 rounded-3xl blur-2xl"></div>
          <div className="relative">
            <ChatInterface publicKey={publicKey} secretKey={secretKey} />
          </div>
        </div>
      </div>

      {/* Hero Section - NOW SECOND */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-black/10 to-white/5 rounded-3xl blur-xl"></div>
        
        <div className="relative backdrop-blur-xl bg-gradient-to-r from-white/10 via-black/5 to-white/10 border border-white/15 rounded-3xl p-8 shadow-2xl animate-slide-in-up">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="text-5xl animate-float-gentle">🤖</div>
              <h1 className="text-5xl font-bold text-white">
                AI Wallet Dashboard
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Manage your Stellar assets with AI-powered natural language commands and smart contract security
            </p>
            
            {/* Enhanced Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/20 p-6 hover:scale-105 transition-all duration-300 animate-fade-in-scale" style={{animationDelay: '0.1s'}}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
                <div className="text-sm font-medium text-gray-300 mb-2">Current Balance</div>
                <div className="text-3xl font-bold text-white">
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${balance} XLM`
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/20 p-6 hover:scale-105 transition-all duration-300 animate-fade-in-scale" style={{animationDelay: '0.2s'}}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">📊</div>
                <div className="text-sm font-medium text-gray-300 mb-2">Daily Spending</div>
                <div className="text-2xl font-bold text-white">
                  {spendingInfo ? `${spendingInfo.dailySpent}/${spendingInfo.dailyLimit} XLM` : '0/1000 XLM'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/20 p-6 hover:scale-105 transition-all duration-300 animate-fade-in-scale" style={{animationDelay: '0.3s'}}>
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {spendingInfo?.isFrozen ? '🔒' : '✅'}
                </div>
                <div className="text-sm font-medium text-gray-300 mb-2">Wallet Status</div>
                <div className={`text-2xl font-bold ${spendingInfo?.isFrozen ? 'text-white/80' : 'text-white'}`}>
                  {spendingInfo?.isFrozen ? 'FROZEN' : 'ACTIVE'}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Content Grid - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enhanced Quick Actions */}
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 shadow-xl animate-fade-in-scale" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="text-2xl animate-pulse-glow">⚡</div>
              <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            </div>
            <div className="space-y-4">
              <button
                onClick={fetchBalance}
                className="w-full kiro-btn kiro-btn-ghost text-left hover:scale-105 transition-all duration-300 py-4"
              >
                <span className="text-xl mr-3">🔄</span>
                <div className="text-left">
                  <div className="font-semibold">Refresh Balance</div>
                  <div className="text-xs text-gray-400">Update your current XLM balance</div>
                </div>
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/stellar/fund-testnet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ publicKey })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      alert('Account funded with 10,000 test XLM!');
                      fetchBalance();
                    } else {
                      alert(`Funding failed: ${data.error}`);
                    }
                  } catch (error) {
                    alert('Failed to fund account. Try using Friendbot directly.');
                  }
                }}
                className="w-full kiro-btn kiro-btn-success text-left hover:scale-105 transition-all duration-300 py-4"
              >
                <span className="text-xl mr-3">💰</span>
                <div className="text-left">
                  <div className="font-semibold">Fund Testnet Account</div>
                  <div className="text-xs text-gray-400">Get 10,000 free test XLM</div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  const commands = [
                    '💰 Basic: "What\'s my balance?"',
                    '📤 Send: "Send 10 XLM to GXXX..."',
                    '🔄 Swap: "Swap 100 XLM to USDC"',
                    '💼 Portfolio: "Show my portfolio"',
                    '💹 Prices: "What\'s the price of USDC?"',
                    '🔒 Security: "Set daily limit to 500 XLM"',
                    '🚨 Emergency: "Freeze my wallet"',
                    '📊 Status: "Status"'
                  ];
                  alert(`Try these AI commands:\n\n${commands.join('\n')}`);
                }}
                className="w-full kiro-btn kiro-btn-secondary text-left hover:scale-105 transition-all duration-300 py-4"
              >
                <span className="text-xl mr-3">🤖</span>
                <div className="text-left">
                  <div className="font-semibold">View AI Commands</div>
                  <div className="text-xs text-gray-400">Multi-asset & swap commands</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced System Status */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 shadow-xl animate-fade-in-scale" style={{animationDelay: '0.5s'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-2xl animate-pulse-glow">📈</div>
            <h3 className="text-xl font-bold text-white">System Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-white/10 to-black/10 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse"></div>
                <span className="font-medium text-white">Wallet Connected</span>
              </div>
              <span className="text-white text-xl">✓</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-white/10 to-black/10 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse"></div>
                <span className="font-medium text-white">Balance Loaded</span>
              </div>
              <span className="text-white text-xl">✓</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-white/10 to-black/10 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse"></div>
                <span className="font-medium text-white">Smart Contracts</span>
              </div>
              <ContractStatus />
            </div>
          </div>
        </div>

        {/* Enhanced Pro Tips */}
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 p-6 shadow-xl animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
          <div className="flex items-center gap-3 mb-6">
            <div className="text-2xl animate-pulse-glow">💡</div>
            <h3 className="text-xl font-bold text-white">Pro Tips</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg">🗣️</div>
              <div>
                <p className="font-medium text-white">Natural Language</p>
                <p className="text-sm text-gray-400">Use conversational commands like "Send 10 XLM to Alice"</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg">🛡️</div>
              <div>
                <p className="font-medium text-white">Smart Security</p>
                <p className="text-sm text-gray-400">Set daily limits and freeze wallet for enhanced protection</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg">👥</div>
              <div>
                <p className="font-medium text-white">Contact Management</p>
                <p className="text-sm text-gray-400">Save frequently used addresses for quick transactions</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors duration-300">
              <div className="text-lg">📊</div>
              <div>
                <p className="font-medium text-white">Analytics Tracking</p>
                <p className="text-sm text-gray-400">Monitor spending patterns and transaction history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}