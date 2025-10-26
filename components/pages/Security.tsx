'use client'

import { useState, useEffect } from 'react'

import { useAppContext } from '@/contexts/AppContext'

export default function Security() {
  const { state, setWalletStatus } = useAppContext()
  const { publicKey, secretKey, walletStatus } = state
  const [loading, setLoading] = useState(false)
  const [emergencyContact, setEmergencyContact] = useState('')
  const [walletSettings, setWalletSettings] = useState<any>(null)

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

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Smart contract API error:', response.status, errorText)
        throw new Error(`API Error (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'Service temporarily unavailable' : errorText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Smart contract call failed')
      }

      return data
    } catch (error: any) {
      console.error('Smart contract error:', error)
      alert(`Security Error: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadSecurityStatus = async () => {
    try {
      const spendingResult = await callSmartContract('get_spending_info')
      if (spendingResult.spendingInfo) {
        setWalletStatus(spendingResult.spendingInfo.isFrozen ? 'frozen' : 'active')
      }

      const settingsResult = await callSmartContract('get_wallet_settings')
      if (settingsResult.settings) {
        setWalletSettings(settingsResult.settings)
        setEmergencyContact(settingsResult.settings.emergencyContact || publicKey)
      }
    } catch (error) {
      console.error('Failed to load security status:', error)
    }
  }

  useEffect(() => {
    if (publicKey) {
      loadSecurityStatus()
    }
  }, [publicKey])

  const handleFreezeWallet = async () => {
    if (confirm('⚠️ Are you sure you want to FREEZE your wallet?\n\nThis will block ALL transactions until you unfreeze it.')) {
      try {
        await callSmartContract('freeze_wallet')
        alert('🚨 Wallet has been FROZEN! All transactions are now blocked.')
        setWalletStatus('frozen')
      } catch (error) {
        console.error('Freeze error:', error)
      }
    }
  }

  const handleUnfreezeWallet = async () => {
    if (confirm('Are you sure you want to UNFREEZE your wallet?\n\nThis will allow transactions again.')) {
      try {
        await callSmartContract('unfreeze_wallet')
        alert('✅ Wallet has been UNFROZEN! Transactions are now allowed.')
        setWalletStatus('active')
      } catch (error) {
        console.error('Unfreeze error:', error)
      }
    }
  }

  const handleUpdateEmergencyContact = async () => {
    if (!emergencyContact) {
      alert('Please enter an emergency contact address')
      return
    }

    if (!emergencyContact.startsWith('G') || emergencyContact.length !== 56) {
      alert('Please enter a valid Stellar address (starts with G, 56 characters)')
      return
    }

    try {
      await callSmartContract('set_wallet_settings', {
        settings: {
          ...walletSettings,
          emergencyContact: emergencyContact
        }
      })
      alert('✅ Emergency contact updated successfully')
      loadSecurityStatus()
    } catch (error) {
      console.error('Update emergency contact error:', error)
    }
  }

  const securityChecklist = [
    {
      id: 'spending_limits',
      title: 'Spending Limits Set',
      description: 'Daily and monthly spending limits configured',
      status: walletSettings?.maxTxAmount ? 'complete' : 'pending',
      action: 'Go to Spending Limits page to configure'
    },
    {
      id: 'emergency_contact',
      title: 'Emergency Contact',
      description: 'Trusted contact who can freeze your wallet',
      status: emergencyContact && emergencyContact !== publicKey ? 'complete' : 'pending',
      action: 'Set emergency contact below'
    },
    {
      id: 'wallet_backup',
      title: 'Wallet Backup',
      description: 'Secret key safely stored offline',
      status: 'manual',
      action: 'Ensure your secret key is backed up securely'
    },
    {
      id: 'testnet_only',
      title: 'Testnet Environment',
      description: 'Using testnet for development',
      status: 'complete',
      action: 'Never use mainnet keys in development'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kiro-card-premium kiro-animate-slideUp">
        <div className="text-center">
          <h1 className="text-3xl font-bold kiro-text-gradient mb-4">🔒 Security Center</h1>
          <p className="text-gray-300">
            Manage your wallet security settings and emergency controls
          </p>
        </div>
      </div>

      {/* Wallet Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="kiro-card kiro-hover-lift">
          <div className="text-center">
            <div className={`text-6xl mb-4 ${walletStatus === 'frozen' ? 'kiro-animate-pulse-slow' : ''}`}>
              {walletStatus === 'frozen' ? '🔒' : '🔓'}
            </div>
            <h3 className="text-xl font-semibold mb-2">Wallet Status</h3>
            <div className={`text-2xl font-bold mb-4 ${
              walletStatus === 'frozen' ? 'text-red-400' : 'text-green-400'
            }`}>
              {walletStatus === 'frozen' ? 'FROZEN' : 'ACTIVE'}
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {walletStatus === 'frozen' 
                ? 'All transactions are blocked for security'
                : 'Wallet is active and ready for transactions'
              }
            </p>
            
            {walletStatus === 'frozen' ? (
              <button
                onClick={handleUnfreezeWallet}
                disabled={loading}
                className="kiro-btn kiro-btn-success w-full"
              >
                🔓 Unfreeze Wallet
              </button>
            ) : (
              <button
                onClick={handleFreezeWallet}
                disabled={loading}
                className="kiro-btn kiro-btn-danger w-full"
              >
                🔒 Freeze Wallet
              </button>
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="kiro-card">
          <h3 className="text-lg font-semibold mb-4 text-orange-400">🚨 Emergency Contact</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Emergency Contact Address
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="kiro-input"
              />
              <p className="text-xs text-gray-400 mt-1">
                This contact can freeze your wallet in emergencies
              </p>
            </div>
            
            <button
              onClick={handleUpdateEmergencyContact}
              disabled={loading || !emergencyContact}
              className="w-full kiro-btn kiro-btn-secondary"
            >
              {loading ? '⏳ Updating...' : '🚨 Update Emergency Contact'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Checklist */}
      <div className="kiro-card">
        <h3 className="text-lg font-semibold mb-4 kiro-text-gradient">✅ Security Checklist</h3>
        <div className="space-y-4">
          {securityChecklist.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 kiro-glass rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  item.status === 'complete' ? 'bg-green-500' : 
                  item.status === 'pending' ? 'bg-orange-500' : 'bg-gray-500'
                }`}>
                  {item.status === 'complete' ? '✓' : 
                   item.status === 'pending' ? '!' : '?'}
                </div>
                <div>
                  <h4 className="font-medium text-white">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            const tips = [
              '🔐 Never share your secret key with anyone',
              '💾 Keep multiple backups of your secret key',
              '🌐 Only use HTTPS websites for wallet access',
              '📱 Consider using hardware wallets for large amounts',
              '🚨 Set up emergency contacts you trust',
              '📊 Monitor your transactions regularly',
              '🔒 Use spending limits as additional protection'
            ];
            alert(`Security Best Practices:\n\n${tips.join('\n\n')}`);
          }}
          className="kiro-btn kiro-btn-ghost"
        >
          💡 Security Tips
        </button>
        
        <button
          onClick={async () => {
            try {
              const result = await callSmartContract('get_spending_analytics')
              if (result.analytics) {
                const report = `Security Report:

🔒 Wallet Status: ${walletStatus.toUpperCase()}
📊 Total Transactions: ${result.analytics.totalTransactions || 0}
💰 Daily Spent: ${result.analytics.dailySpent || 0} XLM
📈 Monthly Spent: ${result.analytics.monthlySpent || 0} XLM
🚨 Emergency Contact: ${emergencyContact ? 'Set' : 'Not Set'}`;
                alert(report);
              }
            } catch (error) {
              console.error('Analytics error:', error)
            }
          }}
          className="kiro-btn kiro-btn-secondary"
        >
          📊 Security Report
        </button>
        
        <button
          onClick={() => {
            const backup = `IMPORTANT: Backup Your Wallet

🔑 Your Secret Key:
${secretKey}

⚠️ SECURITY WARNING:
• Never share this key with anyone
• Store it in a secure location
• This key gives full access to your wallet
• If lost, your funds cannot be recovered

💾 Recommended Backup Methods:
• Write it down on paper (multiple copies)
• Store in a password manager
• Use a hardware wallet
• Keep copies in different secure locations`;
            
            if (confirm('⚠️ This will show your secret key. Make sure no one else can see your screen.\n\nContinue?')) {
              alert(backup);
            }
          }}
          className="kiro-btn kiro-btn-danger"
        >
          🔑 Backup Wallet
        </button>
      </div>

      {/* Security Information */}
      <div className="kiro-card">
        <h3 className="text-lg font-semibold mb-4 kiro-text-gradient">🛡️ Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">🔒 Wallet Freezing</h4>
            <ul className="space-y-1">
              <li>• Instantly blocks all transactions</li>
              <li>• Can be activated by you or emergency contact</li>
              <li>• Reversible when you're ready</li>
              <li>• Protects against unauthorized access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🚨 Emergency Controls</h4>
            <ul className="space-y-1">
              <li>• Trusted contact can freeze your wallet</li>
              <li>• Useful if your device is compromised</li>
              <li>• Emergency contact cannot unfreeze</li>
              <li>• Only you can restore wallet access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}