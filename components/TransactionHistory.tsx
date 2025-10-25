'use client'

import { useState, useEffect } from 'react'

interface TransactionHistoryProps {
  publicKey: string
}

interface Transaction {
  id: string
  type: string
  amount: string
  from?: string
  to?: string
  created_at: string
  successful: boolean
}

export default function TransactionHistory({ publicKey }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    if (!publicKey) return

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/stellar/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicKey })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions')
      }

      setTransactions(data.transactions || [])
    } catch (error: any) {
      setError(error.message)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [publicKey])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'payment':
      case 'send':
        return '↗️'
      case 'receive':
        return '↙️'
      case 'create_account':
        return '🆕'
      default:
        return '📄'
    }
  }

  const getTransactionColor = (type: string, successful: boolean) => {
    if (!successful) return 'text-red-500'
    
    switch (type.toLowerCase()) {
      case 'payment':
      case 'send':
        return 'text-red-500'
      case 'receive':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="kiro-card h-96 flex flex-col kiro-hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold kiro-text-gradient">📊 Transaction History</h2>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="kiro-btn kiro-btn-ghost text-sm"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchTransactions}
              className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {tx.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${getTransactionColor(tx.type, tx.successful)}`}>
                      {tx.successful ? '' : '❌ '}
                      {tx.amount} XLM
                    </p>
                    {tx.from && tx.from !== publicKey && (
                      <p className="text-xs text-gray-500">
                        From: {tx.from.slice(0, 8)}...
                      </p>
                    )}
                    {tx.to && tx.to !== publicKey && (
                      <p className="text-xs text-gray-500">
                        To: {tx.to.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}