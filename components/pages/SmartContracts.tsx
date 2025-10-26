'use client'

import { useState, useEffect } from 'react'

import { useAppContext } from '@/contexts/AppContext'

export default function SmartContracts() {
  const { state, addContact } = useAppContext()
  const { publicKey, secretKey } = state
  const [loading, setLoading] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactAddress, setContactAddress] = useState('')
  const [walletSettings, setWalletSettings] = useState<any>(null)
  const [contractStatus, setContractStatus] = useState<'connected' | 'disconnected'>('disconnected')

  const callSmartContract = async (action: string, params: any = {}) => {
    setLoading(true)
    try {
      const response = await fetch('/api/stellar/smart-limit', {
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
        throw new Error(data.error || 'Smart contract call failed')
      }

      return data
    } catch (error: any) {
      console.error('Smart contract error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadContractStatus = async () => {
    try {
      const result = await callSmartContract('get_spending_info')
      setContractStatus('connected')
      
      const settingsResult = await callSmartContract('get_wallet_settings')
      if (settingsResult.settings) {
        setWalletSettings(settingsResult.settings)
      }
    } catch (error) {
      setContractStatus('disconnected')
      console.error('Failed to load contract status:', error)
    }
  }

  useEffect(() => {
    if (publicKey && secretKey) {
      loadContractStatus()
    }
  }, [publicKey, secretKey])

  const handleAddContact = async () => {
    if (!contactName || !contactAddress) {
      alert('Please enter both contact name and address')
      return
    }

    if (!contactAddress.startsWith('G') || contactAddress.length !== 56) {
      alert('Please enter a valid Stellar address (starts with G, 56 characters)')
      return
    }
    
    try {
      // Save to smart contract
      await callSmartContract('add_contact', {
        contactName,
        contactAddress,
        isTrusted: false
      })
      
      // Also save to local context for persistence across pages
      addContact({
        name: contactName.trim(),
        address: contactAddress.trim(),
        isTrusted: false
      })
      
      alert(`🔗 Contact "${contactName}" added to smart contract and saved locally!`)
      setContactName('')
      setContactAddress('')
    } catch (error: any) {
      alert(`Failed to add contact: ${error.message}`)
    }
  }

  const handleTestConnection = async () => {
    try {
      const result = await callSmartContract('get_spending_info')
      alert(`✅ Smart Contract Connected!\n\nContract ID: ${process.env.NEXT_PUBLIC_CONTRACT_ID || 'Simulated'}\nStatus: Active\nDaily Limit: ${result.spendingInfo?.dailyLimit || 1000} XLM`)
      setContractStatus('connected')
    } catch (error: any) {
      alert(`❌ Smart Contract connection failed:\n${error.message}`)
      setContractStatus('disconnected')
    }
  }

  const handleUpdateSettings = async () => {
    if (!walletSettings) return
    
    try {
      await callSmartContract('set_wallet_settings', {
        settings: walletSettings
      })
      alert('✅ Wallet settings updated successfully')
    } catch (error: any) {
      alert(`Failed to update settings: ${error.message}`)
    }
  }

  const contractFeatures = [
    {
      id: 'spending_limits',
      title: 'Spending Limits',
      description: 'Automated daily and monthly spending controls',
      icon: '💰',
      status: 'active'
    },
    {
      id: 'contact_management',
      title: 'Contact Management',
      description: 'Store and manage trusted contacts on-chain',
      icon: '👥',
      status: 'active'
    },
    {
      id: 'emergency_controls',
      title: 'Emergency Controls',
      description: 'Wallet freezing and emergency contact features',
      icon: '🚨',
      status: 'active'
    },
    {
      id: 'transaction_logging',
      title: 'Transaction Logging',
      description: 'Immutable transaction history and analytics',
      icon: '📊',
      status: 'active'
    },
    {
      id: 'ai_integration',
      title: 'AI Integration',
      description: 'Natural language commands with smart contract validation',
      icon: '🤖',
      status: 'active'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kiro-card-premium kiro-animate-slideUp">
        <div className="text-center">
          <h1 className="text-3xl font-bold kiro-text-gradient mb-4">📋 Smart Contracts</h1>
          <p className="text-gray-300">
            Manage your smart contract settings and blockchain interactions
          </p>
        </div>
      </div>

      {/* Contract Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="kiro-card kiro-hover-lift">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${contractStatus === 'connected' ? 'kiro-animate-glow' : 'kiro-animate-pulse-slow'}`}>
              {contractStatus === 'connected' ? '🔗' : '⚠️'}
            </div>
            <h3 className="text-xl font-semibold mb-2">Contract Status</h3>
            <div className={`text-2xl font-bold mb-4 ${
              contractStatus === 'connected' ? 'text-green-400' : 'text-orange-400'
            }`}>
              {contractStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {contractStatus === 'connected' 
                ? 'Smart contract is active and responding'
                : 'Smart contract connection needs attention'
              }
            </p>
            
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="kiro-btn kiro-btn-primary w-full"
            >
              {loading ? '⏳ Testing...' : '🔍 Test Connection'}
            </button>
          </div>
        </div>

        {/* Contract Info */}
        <div className="kiro-card">
          <h3 className="text-lg font-semibold mb-4 text-purple-400">📄 Contract Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 kiro-glass rounded">
              <span className="text-gray-300">Contract Type:</span>
              <span className="text-white">Advanced Wallet Guard</span>
            </div>
            <div className="flex justify-between items-center p-2 kiro-glass rounded">
              <span className="text-gray-300">Network:</span>
              <span className="text-orange-400">Stellar Testnet</span>
            </div>
            <div className="flex justify-between items-center p-2 kiro-glass rounded">
              <span className="text-gray-300">Version:</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex justify-between items-center p-2 kiro-glass rounded">
              <span className="text-gray-300">Status:</span>
              <span className={contractStatus === 'connected' ? 'text-green-400' : 'text-orange-400'}>
                {contractStatus === 'connected' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Features */}
      <div className="kiro-card">
        <h3 className="text-lg font-semibold mb-4 kiro-text-gradient">⚡ Smart Contract Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractFeatures.map((feature) => (
            <div key={feature.id} className="kiro-glass p-4 rounded-lg kiro-hover-lift">
              <div className="text-center">
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-400 mb-2">{feature.description}</p>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  feature.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {feature.status.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Management */}
      <div className="kiro-card">
        <h3 className="text-lg font-semibold mb-4 text-blue-400">👥 Smart Contract Contacts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-white mb-3">Add New Contact</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name (e.g., Alice)"
                className="kiro-input"
              />
              <input
                type="text"
                value={contactAddress}
                onChange={(e) => setContactAddress(e.target.value)}
                placeholder="GXXX... (Stellar address)"
                className="kiro-input"
              />
              <button
                onClick={handleAddContact}
                disabled={loading || !contactName || !contactAddress}
                className="w-full kiro-btn kiro-btn-secondary"
              >
                {loading ? '⏳ Adding...' : '➕ Add to Smart Contract'}
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-3">Contact Commands</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="p-2 kiro-glass rounded">
                <code>"Save contract Alice GXXX..."</code>
              </div>
              <div className="p-2 kiro-glass rounded">
                <code>"Save GXXX as Alice to contract"</code>
              </div>
              <div className="p-2 kiro-glass rounded">
                <code>"Make Alice trusted"</code>
              </div>
              <div className="p-2 kiro-glass rounded">
                <code>"Send 10 XLM to Alice"</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Settings */}
      {walletSettings && (
        <div className="kiro-card">
          <h3 className="text-lg font-semibold mb-4 text-green-400">⚙️ Wallet Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Auto-approve trusted contacts</label>
                <input
                  type="checkbox"
                  checked={walletSettings.autoApproveTrusted || false}
                  onChange={(e) => setWalletSettings({
                    ...walletSettings,
                    autoApproveTrusted: e.target.checked
                  })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Require memo for transactions</label>
                <input
                  type="checkbox"
                  checked={walletSettings.requireMemo || false}
                  onChange={(e) => setWalletSettings({
                    ...walletSettings,
                    requireMemo: e.target.checked
                  })}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Transaction Amount (XLM)
                </label>
                <input
                  type="number"
                  value={walletSettings.maxTxAmount || 1000}
                  onChange={(e) => setWalletSettings({
                    ...walletSettings,
                    maxTxAmount: parseFloat(e.target.value) || 1000
                  })}
                  className="kiro-input"
                />
              </div>
              
              <button
                onClick={handleUpdateSettings}
                disabled={loading}
                className="w-full kiro-btn kiro-btn-success"
              >
                {loading ? '⏳ Updating...' : '💾 Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            const commands = [
              '💰 "Set daily limit to 500 XLM"',
              '🔒 "Freeze my wallet"',
              '👥 "Save GXXX as Alice to contract"',
              '📊 "Show my spending analytics"',
              '🔄 "Reset my spending limits"',
              '❓ "Status" - Check wallet status'
            ];
            alert(`Smart Contract AI Commands:\n\n${commands.join('\n\n')}`);
          }}
          className="kiro-btn kiro-btn-ghost"
        >
          🤖 AI Commands
        </button>
        
        <button
          onClick={async () => {
            try {
              const result = await callSmartContract('get_transaction_history')
              if (result.transactions) {
                const count = result.transactions.length;
                alert(`📊 Smart Contract Analytics:\n\nTotal Transactions: ${count}\nContract Status: ${contractStatus}\nFeatures Active: ${contractFeatures.filter(f => f.status === 'active').length}/${contractFeatures.length}`);
              }
            } catch (error) {
              console.error('Analytics error:', error)
            }
          }}
          className="kiro-btn kiro-btn-secondary"
        >
          📊 Contract Analytics
        </button>
        
        <button
          onClick={() => {
            const info = `Smart Contract Information:

🔗 Contract Type: Advanced Wallet Guard
🌐 Network: Stellar Testnet
📋 Version: 1.0.0
⚡ Features: ${contractFeatures.length} active modules

🛡️ Security Features:
• Spending limit enforcement
• Emergency wallet freezing
• Contact management
• Transaction logging
• AI command validation

💡 This is a simulated smart contract for development purposes. In production, this would be deployed on the Stellar blockchain.`;
            alert(info);
          }}
          className="kiro-btn kiro-btn-primary"
        >
          ℹ️ Contract Info
        </button>
      </div>
    </div>
  )
}