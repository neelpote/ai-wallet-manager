'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Contact {
  name: string
  address: string
  isTrusted?: boolean
}

interface SpendingInfo {
  dailyLimit: number
  monthlyLimit: number
  dailySpent: number
  monthlySpent: number
  isFrozen: boolean
}

interface AppState {
  // Wallet State
  publicKey: string
  secretKey: string
  balance: string
  
  // Navigation State
  activeTab: string
  
  // Spending Limits State
  spendingInfo: SpendingInfo
  
  // Contacts State
  contacts: Contact[]
  
  // Security State
  walletStatus: 'active' | 'frozen'
}

interface AppContextType {
  state: AppState
  updateWalletKeys: (publicKey: string, secretKey: string) => void
  updateBalance: (balance: string) => void
  setActiveTab: (tab: string) => void
  updateSpendingInfo: (info: Partial<SpendingInfo>) => void
  addContact: (contact: Contact) => void
  removeContact: (name: string) => void
  updateContact: (name: string, updates: Partial<Contact>) => void
  setWalletStatus: (status: 'active' | 'frozen') => void
  resetState: () => void
}

const defaultState: AppState = {
  publicKey: '',
  secretKey: '',
  balance: '0',
  activeTab: 'dashboard',
  spendingInfo: {
    dailyLimit: 1000,
    monthlyLimit: 10000,
    dailySpent: 0,
    monthlySpent: 0,
    isFrozen: false
  },
  contacts: [],
  walletStatus: 'active'
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState)

  // Load general state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('ai-wallet-state')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        setState(prevState => ({
          ...prevState,
          // Load non-sensitive data
          activeTab: parsedState.activeTab || prevState.activeTab,
          spendingInfo: parsedState.spendingInfo || prevState.spendingInfo,
          walletStatus: parsedState.walletStatus || prevState.walletStatus,
          // Don't load sensitive keys from localStorage for security
          publicKey: '',
          secretKey: '',
          contacts: [] // Contacts are loaded separately per wallet
        }))
      } catch (error) {
        console.error('Failed to parse saved state:', error)
      }
    }
  }, [])

  // Save non-sensitive state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      activeTab: state.activeTab,
      spendingInfo: state.spendingInfo,
      walletStatus: state.walletStatus
      // Don't save sensitive wallet keys or contacts (saved separately)
    }
    localStorage.setItem('ai-wallet-state', JSON.stringify(stateToSave))
  }, [state.activeTab, state.spendingInfo, state.walletStatus])

  // Save and load wallet-specific data (contacts and spending info)
  useEffect(() => {
    if (state.publicKey) {
      // Save contacts for this wallet
      if (state.contacts.length > 0) {
        localStorage.setItem(`contacts_${state.publicKey}`, JSON.stringify(state.contacts))
      }
      
      // Save spending info for this wallet
      localStorage.setItem(`spending_${state.publicKey}`, JSON.stringify(state.spendingInfo))
      
      // Load wallet-specific data
      const savedContacts = localStorage.getItem(`contacts_${state.publicKey}`)
      const savedSpending = localStorage.getItem(`spending_${state.publicKey}`)
      
      let needsUpdate = false
      const updates: Partial<AppState> = {}
      
      if (savedContacts) {
        try {
          const contacts = JSON.parse(savedContacts)
          if (JSON.stringify(contacts) !== JSON.stringify(state.contacts)) {
            updates.contacts = contacts
            needsUpdate = true
          }
        } catch (error) {
          console.error('Failed to parse saved contacts:', error)
        }
      }
      
      if (savedSpending) {
        try {
          const spendingInfo = JSON.parse(savedSpending)
          if (JSON.stringify(spendingInfo) !== JSON.stringify(state.spendingInfo)) {
            updates.spendingInfo = spendingInfo
            needsUpdate = true
          }
        } catch (error) {
          console.error('Failed to parse saved spending info:', error)
        }
      }
      
      if (needsUpdate) {
        setState(prevState => ({
          ...prevState,
          ...updates
        }))
      }
    }
  }, [state.publicKey]) // Only run when publicKey changes

  // Save contacts when they change
  useEffect(() => {
    if (state.publicKey && state.contacts.length >= 0) {
      localStorage.setItem(`contacts_${state.publicKey}`, JSON.stringify(state.contacts))
    }
  }, [state.contacts, state.publicKey])

  // Save spending info when it changes
  useEffect(() => {
    if (state.publicKey) {
      localStorage.setItem(`spending_${state.publicKey}`, JSON.stringify(state.spendingInfo))
    }
  }, [state.spendingInfo, state.publicKey])

  const updateWalletKeys = (publicKey: string, secretKey: string) => {
    setState(prevState => ({
      ...prevState,
      publicKey,
      secretKey
    }))
  }

  const updateBalance = (balance: string) => {
    setState(prevState => ({
      ...prevState,
      balance
    }))
  }

  const setActiveTab = (tab: string) => {
    setState(prevState => ({
      ...prevState,
      activeTab: tab
    }))
  }

  const updateSpendingInfo = (info: Partial<SpendingInfo>) => {
    setState(prevState => ({
      ...prevState,
      spendingInfo: {
        ...prevState.spendingInfo,
        ...info
      }
    }))
  }

  const addContact = (contact: Contact) => {
    setState(prevState => ({
      ...prevState,
      contacts: [...prevState.contacts.filter(c => c.name !== contact.name), contact]
    }))
  }

  const removeContact = (name: string) => {
    setState(prevState => ({
      ...prevState,
      contacts: prevState.contacts.filter(c => c.name !== name)
    }))
  }

  const updateContact = (name: string, updates: Partial<Contact>) => {
    setState(prevState => ({
      ...prevState,
      contacts: prevState.contacts.map(contact =>
        contact.name === name ? { ...contact, ...updates } : contact
      )
    }))
  }

  const setWalletStatus = (status: 'active' | 'frozen') => {
    setState(prevState => ({
      ...prevState,
      walletStatus: status,
      spendingInfo: {
        ...prevState.spendingInfo,
        isFrozen: status === 'frozen'
      }
    }))
  }

  const resetState = () => {
    // Clear wallet-specific data if we have a publicKey
    if (state.publicKey) {
      localStorage.removeItem(`contacts_${state.publicKey}`)
      localStorage.removeItem(`spending_${state.publicKey}`)
      localStorage.removeItem(`chat_history_${state.publicKey}`)
    }
    
    setState(defaultState)
    localStorage.removeItem('ai-wallet-state')
  }

  const contextValue: AppContextType = {
    state,
    updateWalletKeys,
    updateBalance,
    setActiveTab,
    updateSpendingInfo,
    addContact,
    removeContact,
    updateContact,
    setWalletStatus,
    resetState
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export default AppContext