'use client'

import { useState, useEffect } from 'react'
import { useAppContext } from '@/contexts/AppContext'

interface SmartContractManagerProps {
  publicKey: string
  secretKey: string
}

interface SpendingInfo {
  dailyLimit: number
  dailySpent: number
  monthlyLimit: number
  monthlySpent: number
  isFrozen?: boolean
}

interface WalletSettings {
  autoApproveTrusted: boolean
  requireMemo: boolean
  maxTxAmount: number
  emergencyContact: string
}

export default function SmartContractManager({ publicKey, secretKey }: SmartContractManagerProps) {
  const { addContact } = useAppContext()
  const [spendingInfo, setSpendingInfo] = useState<SpendingInfo | null>(null)
  const [walletSettings, setWalletSettings] = useState<WalletSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'limits' | 'security' | 'contacts' | 'analytics'>('limits')

  // Form states
  const [dailyLimit, setDailyLimit] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactAddress, setContactAddress] = useState('')

  const callSmartContract = async (action: string, params: any = {}) => {
    console.log('SmartContract call:', { action, publicKey: publicKey?.slice(0, 8) + '...', hasSecretKey: !!secretKey, params });
    
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
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
      console.log('SmartContract response:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Smart contract call failed')
      }

      return data
    } catch (error: any) {
      console.error('SmartContract error:', error);
      alert(`Error: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadSpendingInfo = async () => {
    try {
      const result = await callSmartContract('get_spending_info')
      console.log('Spending info result:', result)
      
      // Parse the actual result from smart contract
      if (result.spendingInfo) {
        setSpendingInfo({
          dailyLimit: result.spendingInfo.dailyLimit || 1000,
          dailySpent: result.spendingInfo.dailySpent || 0,
          monthlyLimit: result.spendingInfo.monthlyLimit || 10000,
          monthlySpent: result.spendingInfo.monthlySpent || 0
        })
      } else {
        // Default values if no data
        setSpendingInfo({
          dailyLimit: 1000,
          dailySpent: 0,
          monthlyLimit: 10000,
          monthlySpent: 0
        })
      }
    } catch (error: any) {
      console.error('Failed to load spending info:', error)
      // Set default values on error
      setSpendingInfo({
        dailyLimit: 1000,
        dailySpent: 0,
        monthlyLimit: 10000,
        monthlySpent: 0
      })
    }
  }

  const loadWalletSettings = async () => {
    try {
      const result = await callSmartContract('get_wallet_settings')
      console.log('Wallet settings result:', result)
      
      if (result.settings) {
        setWalletSettings(result.settings)
        setEmergencyContact(result.settings.emergencyContact || publicKey)
      } else {
        // Default settings
        setWalletSettings({
          autoApproveTrusted: false,
          requireMemo: false,
          maxTxAmount: 1000,
          emergencyContact: publicKey
        })
        setEmergencyContact(publicKey)
      }
    } catch (error: any) {
      console.error('Failed to load wallet settings:', error)
      // Set default values on error
      setWalletSettings({
        autoApproveTrusted: false,
        requireMemo: false,
        maxTxAmount: 1000,
        emergencyContact: publicKey
      })
      setEmergencyContact(publicKey)
    }
  }

  useEffect(() => {
    if (publicKey) {
      loadSpendingInfo()
      loadWalletSettings()
    }
  }, [publicKey])

  const handleSetDailyLimit = async () => {
    console.log('handleSetDailyLimit called with:', dailyLimit);
    
    if (!dailyLimit) {
      console.log('No daily limit value, returning');
      alert('Please enter a daily limit amount');
      return;
    }
    
    try {
      console.log('Calling smart contract with daily limit:', parseFloat(dailyLimit));
      const result = await callSmartContract('set_daily_limit', { dailyLimit: parseFloat(dailyLimit) })
      console.log('Daily limit result:', result)
      alert(`🔒 Daily spending limit set to ${dailyLimit} XLM via smart contract`)
      setDailyLimit('')
      loadSpendingInfo()
    } catch (error: any) {
      console.error('Daily limit error:', error)
      alert(`Failed to set daily limit: ${error.message}`)
    }
  }

  const handleSetMonthlyLimit = async () => {
    console.log('handleSetMonthlyLimit called with:', monthlyLimit);
    
    if (!monthlyLimit) {
      console.log('No monthly limit value, returning');
      alert('Please enter a monthly limit amount');
      return;
    }
    
    try {
      console.log('Calling smart contract with monthly limit:', parseFloat(monthlyLimit));
      const result = await callSmartContract('set_monthly_limit', { monthlyLimit: parseFloat(monthlyLimit) })
      console.log('Monthly limit result:', result)
      alert(`🔒 Monthly spending limit set to ${monthlyLimit} XLM via smart contract`)
      setMonthlyLimit('')
      loadSpendingInfo()
    } catch (error: any) {
      console.error('Monthly limit error:', error)
      alert(`Failed to set monthly limit: ${error.message}`)
    }
  }

  const handleFreezeWallet = async () => {
    if (confirm('Are you sure you want to freeze your wallet? This will block all transactions.')) {
      try {
        const result = await callSmartContract('freeze_wallet')
        console.log('Freeze result:', result)
        alert('🚨 Wallet frozen successfully! All transactions are now blocked.')
        loadSpendingInfo() // Refresh to show frozen status
      } catch (error: any) {
        console.error('Freeze error:', error)
      }
    }
  }

  const handleUnfreezeWallet = async () => {
    try {
      const result = await callSmartContract('unfreeze_wallet')
      console.log('Unfreeze result:', result)
      alert('✅ Wallet unfrozen successfully! Transactions are now allowed.')
      loadSpendingInfo() // Refresh to show unfrozen status
    } catch (error: any) {
      console.error('Unfreeze error:', error)
    }
  }

  const handleAddContact = async () => {
    if (!contactName || !contactAddress) {
      alert('Please enter both contact name and address');
      return;
    }
    
    try {
      // Save to smart contract
      const result = await callSmartContract('add_contact', {
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

  const handleUpdateSettings = async () => {
    if (!walletSettings) return
    await callSmartContract('set_wallet_settings', {
      settings: {
        ...walletSettings,
        emergencyContact: emergencyContact || publicKey
      }
    })
    alert('Wallet settings updated')
  }

  if (!publicKey) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Smart Contract Manager</h2>
        <p className="text-gray-500">Connect your wallet to access smart contract features</p>
        <p className="text-sm text-blue-600 mt-2">
          💡 Enter your public and secret keys in the wallet header above to enable smart contract features
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Advanced Wallet Guard</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${publicKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {publicKey ? 'Connected' : 'Not Connected'}
          </span>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'limits', label: 'Spending Limits' },
          { id: 'security', label: 'Security' },
          { id: 'contacts', label: 'Smart Contacts' },
          { id: 'analytics', label: 'Analytics' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Spending Limits Tab */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Current Status & Limits</h3>
              <button
                onClick={() => {
                  loadSpendingInfo()
                  loadWalletSettings()
                }}
                disabled={loading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>
            {spendingInfo && (
              <div className="space-y-4 mb-4">
                {/* Wallet Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Wallet Status</p>
                  <p className={`text-lg font-bold ${spendingInfo.isFrozen ? 'text-red-600' : 'text-green-600'}`}>
                    {spendingInfo.isFrozen ? '🔒 FROZEN' : '✅ ACTIVE'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {spendingInfo.isFrozen ? 'All transactions blocked' : 'Transactions allowed'}
                  </p>
                </div>
                
                {/* Spending Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Daily Limit</p>
                    <p className="text-2xl font-bold text-blue-800">{spendingInfo.dailyLimit} XLM</p>
                    <p className="text-sm text-blue-600">Spent: {spendingInfo.dailySpent} XLM</p>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((spendingInfo.dailySpent / spendingInfo.dailyLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600">Monthly Limit</p>
                    <p className="text-2xl font-bold text-green-800">{spendingInfo.monthlyLimit} XLM</p>
                    <p className="text-sm text-green-600">Spent: {spendingInfo.monthlySpent} XLM</p>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((spendingInfo.monthlySpent / spendingInfo.monthlyLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-blue-700 mb-2">💰 Set Daily Limit (XLM)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => {
                    console.log('Daily limit input changed to:', e.target.value);
                    setDailyLimit(e.target.value);
                  }}
                  placeholder="1000"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={(e) => {
                    console.log('Set Daily button clicked!');
                    e.preventDefault();
                    handleSetDailyLimit();
                  }}
                  disabled={loading || !dailyLimit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 font-medium"
                >
                  Set Daily
                </button>
              </div>
              <div className="mt-2 text-xs text-blue-600">
                Debug: dailyLimit = "{dailyLimit}", loading = {loading.toString()}, disabled = {(loading || !dailyLimit).toString()}
              </div>
              <button
                onClick={() => {
                  console.log('Test button clicked!');
                  alert('Test button works! dailyLimit = ' + dailyLimit);
                }}
                className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm"
              >
                🧪 Test Button
              </button>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-green-700 mb-2">📅 Set Monthly Limit (XLM)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="10000"
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSetMonthlyLimit}
                  disabled={loading || !monthlyLimit}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 font-medium"
                >
                  Set Monthly
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Emergency Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleFreezeWallet}
                disabled={loading}
                className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 font-medium"
              >
                🔒 Freeze Wallet
              </button>
              <button
                onClick={handleUnfreezeWallet}
                disabled={loading}
                className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 font-medium"
              >
                🔓 Unfreeze Wallet
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Freeze blocks all transactions. Unfreeze restores normal operation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Emergency Contact</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="GXXX... (Stellar address)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUpdateSettings}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Update
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              This contact can freeze your wallet in emergencies
            </p>
          </div>
        </div>
      )}

      {/* Smart Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Add Smart Contract Contact</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={contactName}
                onChange={(e) => {
                  console.log('Contact name changed to:', e.target.value);
                  setContactName(e.target.value);
                }}
                placeholder="Contact name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={contactAddress}
                onChange={(e) => {
                  console.log('Contact address changed to:', e.target.value);
                  setContactAddress(e.target.value);
                }}
                placeholder="GXXX... (Stellar address)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mb-2">
                Debug: contactName="{contactName}", contactAddress="{contactAddress}", disabled={(loading || !contactName || !contactAddress).toString()}
              </div>
              <button
                onClick={(e) => {
                  console.log('Add Contact button clicked!');
                  e.preventDefault();
                  handleAddContact();
                }}
                disabled={loading || !contactName || !contactAddress}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Add to Smart Contract
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">💡 Smart Contract Contact Commands:</p>
              <p className="text-xs text-blue-600 mt-1">• "Save contract Alice GXXX..."</p>
              <p className="text-xs text-blue-600">• "Save GXXX as Alice to contract"</p>
              <p className="text-xs text-blue-600">• "Make Alice trusted"</p>
              <p className="text-xs text-blue-600">• "List contacts"</p>
            </div>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  console.log('Simple test button clicked!');
                  alert(`Simple test works!\nContact Name: "${contactName}"\nContact Address: "${contactAddress}"`);
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded text-sm"
              >
                🚨 Simple Test Button
              </button>
              
              <button
                onClick={async () => {
                  console.log('Testing connection with keys:', { 
                    publicKey: publicKey?.slice(0, 8) + '...', 
                    hasSecretKey: !!secretKey,
                    secretKeyLength: secretKey?.length 
                  });
                  
                  try {
                    const result = await callSmartContract('get_spending_info')
                    alert(`✅ Smart Contract Connected!\nDaily Limit: ${result.spendingInfo?.dailyLimit || 1000} XLM\nStatus: ${result.spendingInfo?.isFrozen ? 'FROZEN' : 'ACTIVE'}`)
                  } catch (error: any) {
                    console.error('Connection test failed:', error);
                    alert('❌ Smart Contract connection failed - check console for details')
                  }
                }}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 text-sm"
              >
                🔗 Test Smart Contract Connection
              </button>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                Debug: Public Key: {publicKey ? `${publicKey.slice(0, 8)}...` : 'Not set'} | 
                Secret Key: {secretKey ? 'Set' : 'Not set'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Spending Analytics</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Smart contract analytics coming soon...</p>
              <p className="text-sm text-gray-600">• Transaction patterns</p>
              <p className="text-sm text-gray-600">• Spending trends</p>
              <p className="text-sm text-gray-600">• Security alerts</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">⏳ Processing smart contract transaction...</p>
        </div>
      )}
    </div>
  )
}