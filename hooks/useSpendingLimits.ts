import { useAppContext } from '@/contexts/AppContext'

export function useSpendingLimits() {
  const { state, updateSpendingInfo } = useAppContext()
  const { spendingInfo, publicKey, secretKey } = state

  const setDailyLimit = async (limit: number) => {
    try {
      const response = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_daily_limit',
          publicKey,
          secretKey,
          dailyLimit: limit
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        updateSpendingInfo({ dailyLimit: limit })
        return { success: true, message: `Daily limit set to ${limit} XLM` }
      } else {
        throw new Error(data.error || 'Failed to set daily limit')
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  const setMonthlyLimit = async (limit: number) => {
    try {
      const response = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_monthly_limit',
          publicKey,
          secretKey,
          monthlyLimit: limit
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        updateSpendingInfo({ monthlyLimit: limit })
        return { success: true, message: `Monthly limit set to ${limit} XLM` }
      } else {
        throw new Error(data.error || 'Failed to set monthly limit')
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  const loadSpendingInfo = async () => {
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
        return { success: true, data: data.spendingInfo }
      } else {
        throw new Error(data.error || 'Failed to load spending info')
      }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  return {
    spendingInfo,
    setDailyLimit,
    setMonthlyLimit,
    loadSpendingInfo
  }
}