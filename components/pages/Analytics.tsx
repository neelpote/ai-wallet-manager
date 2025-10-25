'use client'

import { useState, useEffect } from 'react'
import TransactionHistory from '../TransactionHistory'

interface AnalyticsProps {
  publicKey: string
  secretKey: string
}

export default function Analytics({ publicKey, secretKey }: AnalyticsProps) {
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [spendingInfo, setSpendingInfo] = useState<any>(null)
  const [balance, setBalance] = useState<string>('0')

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Get spending analytics
      const analyticsResponse = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_spending_analytics',
          publicKey,
          secretKey
        })
      })
      
      const analyticsData = await analyticsResponse.json()
      if (analyticsResponse.ok && analyticsData.analytics) {
        setAnalytics(analyticsData.analytics)
      }

      // Get spending info
      const spendingResponse = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_spending_info',
          publicKey,
          secretKey
        })
      })
      
      const spendingData = await spendingResponse.json()
      if (spendingResponse.ok && spendingData.spendingInfo) {
        setSpendingInfo(spendingData.spendingInfo)
      }

      // Get current balance
      const balanceResponse = await fetch('/api/stellar/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey })
      })
      
      const balanceData = await balanceResponse.json()
      if (balanceData.balance !== undefined) {
        setBalance(balanceData.balance)
      }

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (publicKey && secretKey) {
      fetchAnalytics()
    }
  }, [publicKey, secretKey])

  const getSpendingPercentage = (spent: number, limit: number) => {
    return Math.min((spent / limit) * 100, 100)
  }

  const getHealthScore = () => {
    if (!spendingInfo) return 0
    
    let score = 100
    
    // Deduct points for high spending
    const dailyUsage = getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit)
    const monthlyUsage = getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit)
    
    if (dailyUsage > 90) score -= 30
    else if (dailyUsage > 70) score -= 20
    else if (dailyUsage > 50) score -= 10
    
    if (monthlyUsage > 90) score -= 30
    else if (monthlyUsage > 70) score -= 20
    else if (monthlyUsage > 50) score -= 10
    
    // Deduct points if frozen
    if (spendingInfo.isFrozen) score -= 40
    
    return Math.max(score, 0)
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  const healthScore = getHealthScore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kiro-card-premium kiro-animate-slideUp">
        <div className="text-center">
          <h1 className="text-3xl font-bold kiro-text-gradient mb-4">📊 Analytics & History</h1>
          <p className="text-gray-300">
            Monitor your wallet performance, spending patterns, and transaction history
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="kiro-card text-center kiro-hover-lift">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-sm text-gray-400">Current Balance</div>
          <div className="text-xl font-bold kiro-text-gradient">
            {loading ? (
              <span className="kiro-animate-pulse-slow">Loading...</span>
            ) : (
              `${balance} XLM`
            )}
          </div>
        </div>

        <div className="kiro-card text-center kiro-hover-lift">
          <div className="text-3xl mb-2">📈</div>
          <div className="text-sm text-gray-400">Total Transactions</div>
          <div className="text-xl font-bold text-blue-400">
            {analytics?.totalTransactions || 0}
          </div>
        </div>

        <div className="kiro-card text-center kiro-hover-lift">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm text-gray-400">Daily Usage</div>
          <div className="text-xl font-bold text-purple-400">
            {spendingInfo ? `${getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit).toFixed(1)}%` : '0%'}
          </div>
        </div>

        <div className="kiro-card text-center kiro-hover-lift">
          <div className="text-3xl mb-2">🏥</div>
          <div className="text-sm text-gray-400">Wallet Health</div>
          <div className={`text-xl font-bold ${getHealthColor(healthScore)}`}>
            {healthScore}/100
          </div>
        </div>
      </div>

      {/* Spending Overview */}
      {spendingInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily Spending */}
          <div className="kiro-card">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">📅 Daily Spending</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Spent Today</span>
                <span className="text-white font-semibold">{spendingInfo.dailySpent} XLM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Daily Limit</span>
                <span className="text-white font-semibold">{spendingInfo.dailyLimit} XLM</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-white/30 to-black/30 transition-all duration-500"
                  style={{ width: `${getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit)}%` }}
                ></div>
              </div>
              
              <div className="text-center text-sm text-gray-400">
                {(spendingInfo.dailyLimit - spendingInfo.dailySpent).toFixed(2)} XLM remaining today
              </div>
            </div>
          </div>

          {/* Monthly Spending */}
          <div className="kiro-card">
            <h3 className="text-lg font-semibold mb-4 text-green-400">📊 Monthly Spending</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Spent This Month</span>
                <span className="text-white font-semibold">{spendingInfo.monthlySpent} XLM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Monthly Limit</span>
                <span className="text-white font-semibold">{spendingInfo.monthlyLimit} XLM</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-4">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-white/30 to-black/30 transition-all duration-500"
                  style={{ width: `${getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit)}%` }}
                ></div>
              </div>
              
              <div className="text-center text-sm text-gray-400">
                {(spendingInfo.monthlyLimit - spendingInfo.monthlySpent).toFixed(2)} XLM remaining this month
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Health */}
      <div className="kiro-card">
        <h3 className="text-lg font-semibold mb-4 kiro-text-gradient">🏥 Wallet Health Score</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getHealthColor(healthScore)}`}>
              {healthScore}
            </div>
            <div className="text-sm text-gray-400">Health Score</div>
            <div className={`text-lg font-semibold ${getHealthColor(healthScore)}`}>
              {getHealthStatus(healthScore)}
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Health Factors</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Daily Spending</span>
                <span className={spendingInfo && getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit) < 70 ? 'text-green-400' : 'text-orange-400'}>
                  {spendingInfo ? `${getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Monthly Spending</span>
                <span className={spendingInfo && getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit) < 70 ? 'text-green-400' : 'text-orange-400'}>
                  {spendingInfo ? `${getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit).toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Wallet Status</span>
                <span className={spendingInfo?.isFrozen ? 'text-red-400' : 'text-green-400'}>
                  {spendingInfo?.isFrozen ? 'Frozen' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Recommendations</h4>
            <div className="space-y-1 text-sm text-gray-300">
              {healthScore >= 80 ? (
                <>
                  <p>✅ Excellent wallet management!</p>
                  <p>• Keep monitoring your spending</p>
                  <p>• Consider reviewing limits monthly</p>
                </>
              ) : healthScore >= 60 ? (
                <>
                  <p>⚠️ Good, but room for improvement</p>
                  <p>• Monitor daily spending more closely</p>
                  <p>• Consider lowering limits if needed</p>
                </>
              ) : (
                <>
                  <p>🚨 Needs attention</p>
                  <p>• Review your spending patterns</p>
                  <p>• Consider setting stricter limits</p>
                  <p>• Enable additional security features</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="kiro-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold kiro-text-gradient">📋 Transaction History</h3>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="kiro-btn kiro-btn-ghost text-sm"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
        <TransactionHistory publicKey={publicKey} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            if (spendingInfo) {
              const report = `📊 Spending Report

📅 Daily Usage:
• Spent: ${spendingInfo.dailySpent} XLM
• Limit: ${spendingInfo.dailyLimit} XLM
• Usage: ${getSpendingPercentage(spendingInfo.dailySpent, spendingInfo.dailyLimit).toFixed(1)}%

📈 Monthly Usage:
• Spent: ${spendingInfo.monthlySpent} XLM
• Limit: ${spendingInfo.monthlyLimit} XLM
• Usage: ${getSpendingPercentage(spendingInfo.monthlySpent, spendingInfo.monthlyLimit).toFixed(1)}%

🏥 Health Score: ${healthScore}/100 (${getHealthStatus(healthScore)})
🔒 Status: ${spendingInfo.isFrozen ? 'FROZEN' : 'ACTIVE'}`;
              alert(report);
            }
          }}
          className="kiro-btn kiro-btn-ghost"
        >
          📋 Export Report
        </button>
        
        <button
          onClick={() => {
            const tips = [
              '📊 Check your analytics regularly to stay informed',
              '🎯 Keep daily spending under 70% of your limit',
              '📈 Review monthly patterns to adjust limits',
              '🏥 Maintain a health score above 80 for optimal security',
              '🔄 Reset spending counters if needed',
              '⚠️ Investigate any unexpected spending spikes'
            ];
            alert(`Analytics Tips:\n\n${tips.join('\n\n')}`);
          }}
          className="kiro-btn kiro-btn-secondary"
        >
          💡 Analytics Tips
        </button>
        
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/stellar/smart-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'reset_spending_limits',
                  publicKey,
                  secretKey
                })
              });
              
              if (response.ok) {
                alert('✅ Spending counters have been reset to zero');
                fetchAnalytics();
              } else {
                throw new Error('Failed to reset counters');
              }
            } catch (error) {
              alert('❌ Failed to reset spending counters');
            }
          }}
          className="kiro-btn kiro-btn-danger"
        >
          🔄 Reset Counters
        </button>
      </div>
    </div>
  )
}