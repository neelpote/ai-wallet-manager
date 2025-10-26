'use client'

import { useState, useEffect } from 'react'
import { useAppContext } from '@/contexts/AppContext'

interface Asset {
  code: string
  name: string
  balance: number
  priceXLM: number
  valueXLM: number
  issuer?: string
  icon: string
  change24h?: number
}

interface Portfolio {
  owner: string
  assets: { [key: string]: Asset }
  totalValueXLM: number
  lastUpdated: string
}

interface SwapOrder {
  id: string
  fromAsset: string
  toAsset: string
  amountIn: number
  amountOut?: number
  status: string
  timestamp: string
}

export default function MultiAssetPortfolio() {
  const { state } = useAppContext()
  const { publicKey, secretKey } = state

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [supportedAssets, setSupportedAssets] = useState<Asset[]>([])
  const [swapHistory, setSwapHistory] = useState<SwapOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'portfolio' | 'swap' | 'history'>('portfolio')

  // Swap form state
  const [fromAsset, setFromAsset] = useState('XLM')
  const [toAsset, setToAsset] = useState('USDC')
  const [swapAmount, setSwapAmount] = useState('')
  const [swapCalculation, setSwapCalculation] = useState<any>(null)
  const [swapLoading, setSwapLoading] = useState(false)

  useEffect(() => {
    if (publicKey) {
      loadPortfolio()
      loadSupportedAssets()
      loadSwapHistory()
    }
  }, [publicKey])

  useEffect(() => {
    if (swapAmount && fromAsset && toAsset && parseFloat(swapAmount) > 0) {
      calculateSwap()
    }
  }, [swapAmount, fromAsset, toAsset])

  const callMultiAssetAPI = async (action: string, params: any = {}) => {
    try {
      const response = await fetch('/api/stellar/multi-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          publicKey,
          secretKey,
          ...params
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'API call failed')
      }
      return data
    } catch (error: any) {
      console.error('Multi-asset API error:', error)
      throw error
    }
  }

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      const result = await callMultiAssetAPI('get_portfolio')
      setPortfolio(result.portfolio)
    } catch (error: any) {
      console.error('Failed to load portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSupportedAssets = async () => {
    try {
      const result = await callMultiAssetAPI('get_supported_assets')
      setSupportedAssets(result.assets)
    } catch (error: any) {
      console.error('Failed to load supported assets:', error)
    }
  }

  const loadSwapHistory = async () => {
    try {
      const result = await callMultiAssetAPI('get_swap_history')
      setSwapHistory(result.swapHistory || [])
    } catch (error: any) {
      console.error('Failed to load swap history:', error)
    }
  }

  const calculateSwap = async () => {
    try {
      const result = await callMultiAssetAPI('calculate_swap', {
        fromAsset,
        toAsset,
        amount: swapAmount
      })
      setSwapCalculation(result.calculation)
    } catch (error: any) {
      console.error('Failed to calculate swap:', error)
      setSwapCalculation(null)
    }
  }

  const executeSwap = async () => {
    if (!swapAmount || !swapCalculation) return

    try {
      setSwapLoading(true)
      const result = await callMultiAssetAPI('execute_swap', {
        fromAsset,
        toAsset,
        amount: swapAmount
      })

      if (result.success) {
        alert(`✅ Swap successful!\nReceived ${result.amountReceived.toFixed(4)} ${toAsset}`)
        setSwapAmount('')
        setSwapCalculation(null)
        loadPortfolio()
        loadSwapHistory()
      }
    } catch (error: any) {
      alert(`❌ Swap failed: ${error.message}`)
    } finally {
      setSwapLoading(false)
    }
  }

  const formatNumber = (num: number, decimals: number = 4) => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    })
  }

  const getAssetIcon = (code: string) => {
    const icons: { [key: string]: string } = {
      'XLM': '⭐',
      'USDC': '💵',
      'EURC': '💶',
      'AQUA': '🌊',
      'YBX': '📈'
    }
    return icons[code] || '🪙'
  }

  if (!publicKey) {
    return (
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-4">Multi-Asset Portfolio</h2>
        <p className="text-gray-300">Connect your wallet to view your multi-asset portfolio and start swapping tokens.</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 shadow-2xl">
      {/* Header */}
      <div className="border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Multi-Asset Portfolio</h2>
            <p className="text-gray-300">Manage and swap your Stellar assets</p>
          </div>
          {portfolio && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(portfolio.totalValueXLM)} XLM
              </p>
              <p className="text-sm text-gray-400">
                ≈ ${formatNumber(portfolio.totalValueXLM * 0.12, 2)} USD
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-8 py-4 border-b border-white/10">
        <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
          {[
            { id: 'portfolio', label: '💼 Portfolio', icon: '💼' },
            { id: 'swap', label: '🔄 Swap', icon: '🔄' },
            { id: 'history', label: '📊 History', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8">
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
                <p className="text-gray-300">Loading portfolio...</p>
              </div>
            ) : portfolio ? (
              <div className="space-y-4">
                {Object.values(portfolio.assets).map((asset) => (
                  <div
                    key={asset.code}
                    className="bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{getAssetIcon(asset.code)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{asset.code}</h3>
                          <p className="text-sm text-gray-400">
                            {supportedAssets.find(a => a.code === asset.code)?.name || asset.code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          {formatNumber(asset.balance)} {asset.code}
                        </p>
                        <p className="text-sm text-gray-400">
                          ≈ {formatNumber(asset.valueXLM)} XLM
                        </p>
                        <p className="text-xs text-gray-500">
                          1 {asset.code} = {formatNumber(asset.priceXLM)} XLM
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={loadPortfolio}
                  className="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all duration-300"
                >
                  🔄 Refresh Portfolio
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">No portfolio data available</p>
              </div>
            )}
          </div>
        )}

        {/* Swap Tab */}
        {activeTab === 'swap' && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">🔄 Token Swap</h3>
              
              <div className="space-y-4">
                {/* From Asset */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">From</label>
                  <div className="flex gap-2">
                    <select
                      value={fromAsset}
                      onChange={(e) => setFromAsset(e.target.value)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    >
                      {supportedAssets.map((asset) => (
                        <option key={asset.code} value={asset.code} className="bg-gray-800">
                          {getAssetIcon(asset.code)} {asset.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-white/40"
                    />
                  </div>
                  {portfolio?.assets[fromAsset] && (
                    <p className="text-xs text-gray-400 mt-1">
                      Balance: {formatNumber(portfolio.assets[fromAsset].balance)} {fromAsset}
                    </p>
                  )}
                </div>

                {/* Swap Direction */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      const temp = fromAsset
                      setFromAsset(toAsset)
                      setToAsset(temp)
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all duration-300"
                  >
                    ↕️
                  </button>
                </div>

                {/* To Asset */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">To</label>
                  <div className="flex gap-2">
                    <select
                      value={toAsset}
                      onChange={(e) => setToAsset(e.target.value)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    >
                      {supportedAssets.map((asset) => (
                        <option key={asset.code} value={asset.code} className="bg-gray-800">
                          {getAssetIcon(asset.code)} {asset.code}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300">
                      {swapCalculation ? formatNumber(swapCalculation.amountOut) : '0.0'}
                    </div>
                  </div>
                </div>

                {/* Swap Details */}
                {swapCalculation && (
                  <div className="bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Rate</span>
                      <span className="text-white">
                        1 {fromAsset} = {formatNumber(swapCalculation.rate)} {toAsset}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Fee (0.3%)</span>
                      <span className="text-white">{formatNumber(swapCalculation.fee)} {fromAsset}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Minimum Received</span>
                      <span className="text-white">
                        {formatNumber(swapCalculation.minimumReceived)} {toAsset}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price Impact</span>
                      <span className="text-green-400">{swapCalculation.priceImpact.toFixed(2)}%</span>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <button
                  onClick={executeSwap}
                  disabled={!swapAmount || !swapCalculation || swapLoading || !secretKey}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {swapLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                      Swapping...
                    </div>
                  ) : !secretKey ? (
                    'Connect Wallet to Swap'
                  ) : (
                    `Swap ${swapAmount || '0'} ${fromAsset} → ${toAsset}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">📊 Swap History</h3>
              <button
                onClick={loadSwapHistory}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-all duration-300"
              >
                🔄 Refresh
              </button>
            </div>

            {swapHistory.length > 0 ? (
              <div className="space-y-3">
                {swapHistory.map((swap) => (
                  <div
                    key={swap.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{getAssetIcon(swap.fromAsset)}</span>
                          <span className="text-sm text-gray-400">→</span>
                          <span className="text-lg">{getAssetIcon(swap.toAsset)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {formatNumber(swap.amountIn)} {swap.fromAsset} → {swap.toAsset}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(swap.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          swap.status === 'completed' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {swap.status}
                        </div>
                        {swap.amountOut && (
                          <p className="text-xs text-gray-400 mt-1">
                            +{formatNumber(swap.amountOut)} {swap.toAsset}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-300">No swap history found</p>
                <p className="text-sm text-gray-400 mt-2">Your completed swaps will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}