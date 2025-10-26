'use client'

import { useState, useEffect } from 'react'

export default function ContractStatus() {
  const [contractInfo, setContractInfo] = useState<{
    isReal: boolean
    contractId?: string
    status: 'loading' | 'connected' | 'simulation' | 'error'
    message: string
  }>({
    isReal: false,
    status: 'loading',
    message: 'Checking contract status...'
  })

  useEffect(() => {
    checkContractStatus()
  }, [])

  const checkContractStatus = async () => {
    try {
      // Check if contract ID is configured
      const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID
      
      if (!contractId) {
        setContractInfo({
          isReal: false,
          status: 'simulation',
          message: 'Using simulated smart contract for development'
        })
        return
      }

      // Test contract connection by checking if we can get spending info
      try {
        const response = await fetch('/api/stellar/smart-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_spending_info',
            publicKey: contractId, // Use contract ID as dummy key for test
            secretKey: 'SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
          })
        })

        if (response.ok) {
          const data = await response.json()
          setContractInfo({
            isReal: true,
            contractId,
            status: 'connected',
            message: data.mode === 'blockchain-ready-simulation' 
              ? 'Blockchain-ready simulation (contract deployed)'
              : 'Connected to real smart contract on Stellar Testnet'
          })
        } else {
          throw new Error('Contract test failed')
        }
      } catch (error) {
        setContractInfo({
          isReal: false,
          status: 'simulation',
          message: 'Smart contract unavailable, using simulation'
        })
      }

      if (response.ok) {
        setContractInfo({
          isReal: true,
          contractId,
          status: 'connected',
          message: 'Connected to real smart contract on Stellar Testnet'
        })
      } else {
        setContractInfo({
          isReal: false,
          status: 'simulation',
          message: 'Smart contract unavailable, using simulation'
        })
      }
    } catch (error) {
      setContractInfo({
        isReal: false,
        status: 'simulation',
        message: 'Smart contract unavailable, using simulation'
      })
    }
  }

  const getStatusColor = () => {
    switch (contractInfo.status) {
      case 'connected': return 'text-green-400 border-green-400/30 bg-green-400/10'
      case 'simulation': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
      case 'error': return 'text-red-400 border-red-400/30 bg-red-400/10'
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    }
  }

  const getStatusIcon = () => {
    switch (contractInfo.status) {
      case 'connected': return '🔗'
      case 'simulation': return '🎭'
      case 'error': return '❌'
      default: return '⏳'
    }
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs border ${getStatusColor()}`}>
      <span className="text-sm">{getStatusIcon()}</span>
      <span className="font-medium">
        {contractInfo.status === 'connected' ? 'Real Contract' : 
         contractInfo.status === 'simulation' ? 'Simulation' : 
         contractInfo.status === 'loading' ? 'Loading...' : 'Error'}
      </span>
      {contractInfo.contractId && (
        <span className="opacity-70">
          {contractInfo.contractId.slice(0, 8)}...
        </span>
      )}
    </div>
  )
}