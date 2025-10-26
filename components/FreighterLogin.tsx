'use client'

import { useState, useEffect } from 'react'
import { freighterWallet, detectFreighterInstallation, getFreighterInstallUrl } from '@/lib/freighterWallet'
import { needsFreighterActivation, triggerFreighterInjection } from '@/lib/extensionDetection'
import { useAppContext } from '@/contexts/AppContext'

export default function FreighterLogin() {
  const { updateWalletKeys } = useAppContext()
  const [status, setStatus] = useState({
    available: false,
    connected: false,
    allowed: false,
    publicKey: undefined as string | undefined,
    network: undefined as string | undefined
  })
  const [activationStatus, setActivationStatus] = useState({
    installed: false,
    injected: false,
    needsActivation: false,
    message: 'Checking Freighter status...'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check Freighter status on mount and periodically
  useEffect(() => {
    checkStatus()
    checkActivationStatus()
    
    // Check status every 2 seconds
    const interval = setInterval(() => {
      checkStatus()
      checkActivationStatus()
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const newStatus = await freighterWallet.getStatus()
      setStatus(newStatus)
      
      // If we have a public key and it's different from current, auto-connect
      if (newStatus.publicKey && newStatus.allowed) {
        // Auto-update if status changed
        const currentKeys = localStorage.getItem('connectedWalletType')
        if (currentKeys !== 'freighter') {
          updateWalletKeys(newStatus.publicKey, '')
          localStorage.setItem('connectedWalletType', 'freighter')
          localStorage.setItem('connectedWalletName', 'Freighter Wallet')
        }
      }
    } catch (error) {
      console.error('Status check failed:', error)
    }
  }

  const checkActivationStatus = async () => {
    try {
      const activation = await needsFreighterActivation()
      setActivationStatus(activation)
    } catch (error) {
      console.error('Activation check failed:', error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await freighterWallet.connect()
      
      if (result.success && result.publicKey) {
        updateWalletKeys(result.publicKey, '')
        localStorage.setItem('connectedWalletType', 'freighter')
        localStorage.setItem('connectedWalletName', 'Freighter Wallet')
        
        setSuccess(`Connected successfully! Public Key: ${result.publicKey.slice(0, 8)}...${result.publicKey.slice(-8)}`)
        
        // Refresh status
        await checkStatus()
      } else {
        setError(result.error || 'Connection failed')
      }
    } catch (error: any) {
      setError(`Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInstall = () => {
    window.open(getFreighterInstallUrl(), '_blank')
  }

  const handleForceActivation = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const success = await triggerFreighterInjection()
      if (success) {
        setSuccess('Freighter activated! Please try connecting now.')
        await checkStatus()
        await checkActivationStatus()
      } else {
        setError('Could not activate Freighter. Please click the Freighter icon in your browser toolbar.')
      }
    } catch (error: any) {
      setError(`Activation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    freighterWallet.disconnect()
    updateWalletKeys('', '')
    localStorage.removeItem('connectedWalletType')
    localStorage.removeItem('connectedWalletName')
    setSuccess(null)
    setError(null)
    checkStatus()
  }

  // If not available, show installation prompt
  if (!status.available) {
    return (
      <div className="kiro-card p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-bold text-white mb-3">Install Freighter Wallet</h3>
          <p className="text-gray-400 mb-6">
            Freighter is a secure browser extension wallet for Stellar. Install it to connect with one click.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleInstall}
              className="w-full kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
            >
              <span className="mr-2">📥</span>
              Install Freighter Extension
            </button>
            
            <div className="text-xs text-gray-500">
              <p>After installation:</p>
              <p>1. Click the Freighter icon in your toolbar</p>
              <p>2. Create or import a wallet</p>
              <p>3. Switch to Testnet in settings</p>
              <p>4. Refresh this page</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If available but not connected/allowed
  if (status.available && (!status.connected || !status.allowed || !status.publicKey)) {
    return (
      <div className="kiro-card p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-xl font-bold text-white mb-3">Connect Freighter Wallet</h3>
          <p className="text-gray-400 mb-6">
            Freighter is installed! Connect your wallet to start using AI-powered features.
          </p>

          {/* Status indicators */}
          <div className="mb-6 space-y-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span>Extension Installed</span>
              <span className="text-green-400">✅</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span>Wallet Connected</span>
              <span className={status.connected ? 'text-green-400' : 'text-orange-400'}>
                {status.connected ? '✅' : '⏳'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span>Permission Granted</span>
              <span className={status.allowed ? 'text-green-400' : 'text-orange-400'}>
                {status.allowed ? '✅' : '⏳'}
              </span>
            </div>
            {status.network && (
              <div className="flex items-center justify-between p-2 bg-white/5 rounded">
                <span>Network</span>
                <span className={status.network === 'TESTNET' ? 'text-green-400' : 'text-orange-400'}>
                  {status.network}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded text-green-300 text-sm">
              {success}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full kiro-btn kiro-btn-primary hover:scale-105 transition-transform duration-300"
          >
            {loading ? (
              <>
                <span className="mr-2">⏳</span>
                Connecting...
              </>
            ) : (
              <>
                <span className="mr-2">🔗</span>
                Connect Wallet
              </>
            )}
          </button>

          <div className="mt-4 text-xs text-gray-500">
            <p>Make sure you're logged into Freighter and on Testnet</p>
          </div>
        </div>
      </div>
    )
  }

  // If connected successfully
  return (
    <div className="kiro-card p-6 max-w-md mx-auto">
      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-white mb-3">Freighter Connected!</h3>
        <p className="text-gray-400 mb-6">
          Your Freighter wallet is connected and ready to use.
        </p>

        {/* Connection details */}
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
            <span>Status</span>
            <span className="text-green-400">Connected ✅</span>
          </div>
          {status.publicKey && (
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span>Public Key</span>
              <span className="font-mono text-xs">
                {status.publicKey.slice(0, 8)}...{status.publicKey.slice(-8)}
              </span>
            </div>
          )}
          {status.network && (
            <div className="flex items-center justify-between p-2 bg-white/5 rounded">
              <span>Network</span>
              <span className="text-green-400">{status.network}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-300">
            You can now use all AI wallet features with secure Freighter signing!
          </p>
          
          <button
            onClick={handleDisconnect}
            className="w-full kiro-btn kiro-btn-ghost hover:scale-105 transition-transform duration-300"
          >
            <span className="mr-2">🔌</span>
            Disconnect
          </button>
        </div>
      </div>
    </div>
  )
}