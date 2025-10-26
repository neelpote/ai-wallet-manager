'use client'

import { useState } from 'react'
import { useAppContext } from '@/contexts/AppContext'

export default function QuickStart() {
  const { updateWalletKeys } = useAppContext()
  const [loading, setLoading] = useState(false)

  const quickConnect = async () => {
    setLoading(true)
    
    try {
      // Generate new testnet keys
      const response = await fetch('/api/stellar/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const data = await response.json()
      
      if (response.ok && data.publicKey && data.secretKey) {
        updateWalletKeys(data.publicKey, data.secretKey)
        localStorage.setItem('connectedWalletType', 'manual')
        localStorage.setItem('connectedWalletName', 'Generated Keys')
      } else {
        throw new Error('Failed to generate keys')
      }
    } catch (error) {
      // Use fallback keys
      updateWalletKeys(
        'GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3',
        'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4'
      )
      localStorage.setItem('connectedWalletType', 'manual')
      localStorage.setItem('connectedWalletName', 'Demo Keys')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      <div className="kiro-card p-8 max-w-md mx-auto">
        <div className="text-4xl mb-4">⚡</div>
        <h3 className="text-xl font-bold text-white mb-3">Skip the Setup</h3>
        <p className="text-gray-400 mb-6">
          Get started instantly with generated testnet keys. Perfect for trying out the AI wallet features!
        </p>
        
        <button
          onClick={quickConnect}
          disabled={loading}
          className="w-full kiro-btn kiro-btn-primary text-lg py-4 hover:scale-105 transition-transform duration-300"
        >
          {loading ? (
            <>
              <span className="mr-2">⏳</span>
              Generating Keys...
            </>
          ) : (
            <>
              <span className="mr-2">🚀</span>
              Quick Start with New Keys
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          This creates new testnet keys and connects automatically. You can fund the account and start using AI features immediately.
        </p>
      </div>
    </div>
  )
}