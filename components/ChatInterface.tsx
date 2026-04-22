'use client'

import { useState, useEffect } from 'react'

import { useAppContext } from '@/contexts/AppContext'

// Network configuration
const STELLAR_NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015' // Testnet

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatInterface() {
  const { state, addContact, updateBalance, updateSpendingInfo } = useAppContext()
  const { publicKey, secretKey, contacts, spendingInfo } = state
  
  const getDefaultWelcomeMessage = (): Message => ({
    id: '1',
    text: 'Hi! I\'m your advanced AI wallet assistant! 🤖✨ I understand natural language, so just talk to me normally!\n\n🗣️ **Talk Naturally - Try These:**\n• "How much money do I have?"\n• "Send some stellar to Alice"\n• "Swap half my lumens for dollars"\n• "Is my wallet safe right now?"\n• "What\'s my USDC worth in XLM?"\n\n🧠 **I\'m Smart About:**\n• **Typos**: "XML" → I know you mean XLM\n• **Aliases**: "stellar/lumens" = XLM, "dollars" = USDC\n• **Amounts**: "half", "all", "some", "10%"\n• **Context**: I remember our conversation\n• **Safety**: I\'ll ask before risky actions\n\n💡 **Advanced Examples:**\n• "Lock everything down!" (emergency freeze)\n• "Trade some aqua tokens for euros"\n• "Can you check if I have enough to send 100 XLM?"\n• "What should I do to make my wallet safer?"\n\nJust speak naturally - I\'ll figure out what you want! 🚀',
    isUser: false,
    timestamp: new Date()
  })
  
  const [messages, setMessages] = useState<Message[]>([getDefaultWelcomeMessage()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingCommand, setPendingCommand] = useState<any>(null)

  // Load chat history when wallet connects
  useEffect(() => {
    if (publicKey) {
      const savedHistory = localStorage.getItem(`chat_history_${publicKey}`)
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory)
          // Convert timestamp strings back to Date objects
          const historyWithDates = parsedHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          setMessages(historyWithDates)
        } catch (error) {
          console.error('Failed to parse chat history:', error)
          // If parsing fails, start with welcome message
          setMessages([getDefaultWelcomeMessage()])
        }
      } else {
        // No saved history, start with welcome message
        setMessages([getDefaultWelcomeMessage()])
      }
    }
  }, [publicKey])

  // Save chat history when messages change
  useEffect(() => {
    if (publicKey && messages.length > 0) {
      localStorage.setItem(`chat_history_${publicKey}`, JSON.stringify(messages))
    }
  }, [messages, publicKey])

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  // Contact management functions
  const saveContact = (name: string, address: string) => {
    addContact({ name: name.toLowerCase(), address })
  }

  const getContact = async (name: string): Promise<string | null> => {
    // First check local contacts
    const localContact = contacts.find(c => c.name === name.toLowerCase())
    
    if (localContact) {
      return localContact.address;
    }
    
    // If not found locally, check smart contract
    try {
      const response = await fetch('/api/stellar/smart-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_contact',
          publicKey,
          secretKey,
          contactName: name
        })
      });
      
      const data = await response.json();
      if (response.ok && data.contact) {
        console.log(`Found contact "${name}" in smart contract:`, data.contact.address);
        return data.contact.address;
      }
    } catch (error) {
      console.log(`Contact "${name}" not found in smart contract:`, error);
    }
    
    return null;
  }

  const listContacts = async (): Promise<string> => {
    let result = '';
    
    if (contacts.length > 0) {
      result += `📱 Local Contacts:\n${contacts.map(contact => 
        `• ${contact.name}: ${contact.address.slice(0, 8)}...${contact.address.slice(-8)}`
      ).join('\n')}\n\n`;
    }
    
    // Try to get smart contract contacts (this is a simplified approach)
    result += `🔗 Smart Contract Contacts:\n💡 Use "Send 10 XLM to contactname" to send to any saved contact\n💡 Contacts saved via Smart Contract Manager are also available`;
    
    if (contacts.length === 0) {
      result = 'No local contacts saved yet.\n\n💡 Save contacts:\n• Local: "Save GXXX as John"\n• Smart Contract: Use the Smart Contract Manager interface\n\n🔗 Smart contract contacts are automatically available for sending!';
    }
    
    return result;
  }

  const clearChatHistory = () => {
    if (publicKey) {
      localStorage.removeItem(`chat_history_${publicKey}`)
      setMessages([getDefaultWelcomeMessage()])
      setPendingCommand(null)
    }
  }

  const calculateRelativeAmount = async (percentageStr: string, assetCode: string): Promise<number> => {
    try {
      const percentage = parseFloat(percentageStr.replace('%', ''))
      
      if (assetCode === 'XLM') {
        // Get XLM balance
        const response = await fetch('/api/stellar/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey })
        })
        const data = await response.json()
        const balance = parseFloat(data.balance || '0')
        return (balance * percentage) / 100
      } else {
        // Get multi-asset portfolio for other assets
        const response = await fetch('/api/stellar/multi-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_portfolio',
            publicKey
          })
        })
        const data = await response.json()
        const asset = data.portfolio?.assets?.[assetCode]
        const balance = asset ? parseFloat(asset.balance) : 0
        return (balance * percentage) / 100
      }
    } catch (error) {
      console.error('Error calculating relative amount:', error)
      return 0
    }
  }

  const generateSmartSuggestion = (parsedCommand: any): string => {
    const suggestions = [
      "🤖 **Smart Suggestions Based on Your Activity:**\n",
      "💡 **Popular Actions:**",
      "• Check your portfolio value: \"What's my portfolio worth?\"",
      "• Set up security: \"Make my wallet safer\"",
      "• Quick swap: \"Trade some XLM for USDC\"",
      "• Check prices: \"What's the best rate for swapping?\"",
      "\n🔮 **Predictive Suggestions:**",
      "• Based on your balance, you might want to diversify",
      "• Consider setting spending limits for security",
      "• Your XLM could earn more if swapped to USDC",
      "\n💬 **Try Natural Language:**",
      "• \"Should I swap now or wait?\"",
      "• \"What's the safest amount to keep in XLM?\"",
      "• \"Help me understand my portfolio\"",
      "• \"What would you do with my assets?\""
    ].join('\n')

    return suggestions
  }

  const getSmartPlaceholder = (): string => {
    const placeholders = [
      "Try: 'How much money do I have?'",
      "Ask: 'Swap some stellar for dollars'",
      "Say: 'Is my wallet safe right now?'",
      "Try: 'What should I do with my assets?'",
      "Ask: 'Trade half my XLM for USDC'",
      "Say: 'Lock everything down!'",
      "Try: 'What's my USDC worth?'",
      "Ask: 'Send some lumens to Alice'"
    ]
    
    // Rotate placeholder based on time to keep it fresh
    const index = Math.floor(Date.now() / 10000) % placeholders.length
    return placeholders[index]
  }

  const executeCommand = async (parsedCommand: any) => {
    try {
      let response
      
      // Handle relative amounts (50%, all, etc.)
      if (parsedCommand.amount && typeof parsedCommand.amount === 'string' && parsedCommand.amount.includes('%')) {
        parsedCommand.amount = await calculateRelativeAmount(parsedCommand.amount, parsedCommand.fromAsset || 'XLM')
      }
      
      switch (parsedCommand.action) {
        case 'greeting':
          return `Hey! 👋 I'm your AI wallet assistant. I can help you:\n\n• Check your balance — "What's my balance?"\n• Send XLM — "Send 10 XLM to G..."\n• Swap assets — "Swap 50 XLM to USDC"\n• View portfolio — "Show my portfolio"\n• Check prices — "What are current rates?"\n\nWhat would you like to do?`

        case 'help':
          return `Here's what I can do:\n\n💰 **Wallet**\n• "What's my balance?"\n• "Show my portfolio"\n• "Transaction history"\n\n📤 **Send**\n• "Send 10 XLM to G..."\n• "Send 5 XLM to Alice"\n\n🔄 **Swap**\n• "Swap 100 XLM to USDC"\n• "Calculate swap 50 XLM to EURC"\n\n🔒 **Security**\n• "Freeze my wallet"\n• "Set daily limit to 500 XLM"\n• "Check spending limits"\n\n👥 **Contacts**\n• "Save G... as Alice"\n• "List contacts"`

        case 'balance':
          response = await fetch('/api/stellar/balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey })
          })
          break
          
        case 'history':
          response = await fetch('/api/stellar/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey })
          })
          break
          
        case 'send':
          if (!parsedCommand.amount || !parsedCommand.recipient) {
            throw new Error('Amount and recipient are required for sending')
          }
          
          // Handle Freighter wallet transactions (no secret key)
          if (!secretKey) {
            // Import Freighter functions
            const { signTransaction } = await import('@/lib/freighterWallet')
            
            // Create transaction XDR for Freighter to sign
            const transactionResponse = await fetch('/api/stellar/create-transaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicKey,
                recipient: parsedCommand.recipient,
                amount: parsedCommand.amount
              })
            })
            
            if (!transactionResponse.ok) {
              throw new Error('Failed to create transaction')
            }
            
            const { transactionXDR } = await transactionResponse.json()
            
            // Sign with Freighter (using testnet)
            const signedXDR = await signTransaction(transactionXDR, STELLAR_NETWORK_PASSPHRASE)
            
            // Submit signed transaction
            response = await fetch('/api/stellar/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicKey,
                recipient: parsedCommand.recipient,
                amount: parsedCommand.amount,
                signedTransaction: signedXDR
              })
            })
          } else {
            // Handle manual wallet transactions (with secret key)
            response = await fetch('/api/stellar/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicKey,
                secretKey,
                recipient: parsedCommand.recipient,
                amount: parsedCommand.amount
              })
            })
          }
          break
          
        case 'set_limit':
          if (!parsedCommand.limit) {
            throw new Error('Limit amount is required')
          }
          // Update daily limit in context (will be persisted automatically)
          updateSpendingInfo({ dailyLimit: parsedCommand.limit })
          return `Daily spending limit set to ${parsedCommand.limit} XLM`
          
        case 'check_limit':
          return `Current spending limits:\n• Daily: ${spendingInfo.dailySpent}/${spendingInfo.dailyLimit} XLM\n• Monthly: ${spendingInfo.monthlySpent}/${spendingInfo.monthlyLimit} XLM`
          
        case 'save_contact':
          if (!parsedCommand.contactName || !parsedCommand.recipient) {
            throw new Error('Contact name and address are required')
          }
          saveContact(parsedCommand.contactName, parsedCommand.recipient)
          return `✅ Contact "${parsedCommand.contactName}" saved locally with address ${parsedCommand.recipient.slice(0, 8)}...${parsedCommand.recipient.slice(-8)}`
          
        case 'save_contact_to_contract':
          if (!parsedCommand.contactName || !parsedCommand.recipient) {
            throw new Error('Contact name and address are required')
          }
          
          try {
            console.log('Saving contact to smart contract:', {
              contactName: parsedCommand.contactName,
              recipient: parsedCommand.recipient
            });
            
            response = await fetch('/api/stellar/smart-limit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add_contact',
                publicKey,
                secretKey,
                contactName: parsedCommand.contactName,
                contactAddress: parsedCommand.recipient,
                isTrusted: false
              })
            })
            
            const contactData = await response.json()
            console.log('Smart contract response:', contactData);
            
            if (!response.ok) {
              throw new Error(contactData.error || 'Failed to save contact to smart contract')
            }
            
            // Also save locally for quick access
            saveContact(parsedCommand.contactName, parsedCommand.recipient)
            
            return `🔗 Contact "${parsedCommand.contactName}" saved to smart contract and locally!\nAddress: ${parsedCommand.recipient.slice(0, 8)}...${parsedCommand.recipient.slice(-8)}\n💡 Now you can send with: "Send 10 XLM to ${parsedCommand.contactName}"`
          } catch (contractError: any) {
            console.error('Smart contract error:', contractError);
            // Fallback to local saving if smart contract fails
            saveContact(parsedCommand.contactName, parsedCommand.recipient)
            return `⚠️ Smart contract unavailable, saved "${parsedCommand.contactName}" locally instead.\nAddress: ${parsedCommand.recipient.slice(0, 8)}...${parsedCommand.recipient.slice(-8)}\n💡 You can still send with: "Send 10 XLM to ${parsedCommand.contactName}"`
          }
          
        case 'list_contacts':
          return await listContacts()
          
        case 'list_contract_contacts':
          // For now, show both local and indicate smart contract capability
          const localContacts = await listContacts()
          return localContacts
          
        case 'send_to_contact':
          if (!parsedCommand.contactName || !parsedCommand.amount) {
            throw new Error('Contact name and amount are required')
          }
          
          const contactAddress = await getContact(parsedCommand.contactName)
          if (!contactAddress) {
            throw new Error(`Contact "${parsedCommand.contactName}" not found. Try: "list contacts" to see saved contacts or save the contact first with "Save GXXX as ${parsedCommand.contactName}"`)
          }
          
          // Send to the contact's address
          if (!secretKey) {
            // Handle Freighter wallet transactions (no secret key)
            const { signTransaction } = await import('@/lib/freighterWallet')
            
            // Create transaction XDR for Freighter to sign
            const transactionResponse = await fetch('/api/stellar/create-transaction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicKey,
                recipient: contactAddress,
                amount: parsedCommand.amount
              })
            })
            
            if (!transactionResponse.ok) {
              throw new Error('Failed to create transaction')
            }
            
            const { transactionXDR } = await transactionResponse.json()
            
            // Sign with Freighter (using testnet)
            const signedXDR = await signTransaction(transactionXDR, STELLAR_NETWORK_PASSPHRASE)
            
            // Submit signed transaction
            response = await fetch('/api/stellar/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicKey,
                recipient: contactAddress,
                amount: parsedCommand.amount,
                signedTransaction: signedXDR
              })
            })
          } else {
            // Handle manual wallet transactions (with secret key)
            response = await fetch('/api/stellar/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                publicKey,
                secretKey,
                recipient: contactAddress,
                amount: parsedCommand.amount
              })
            })
          }
          
          const sendData = await response.json()
          if (!response.ok) {
            throw new Error(sendData.error || 'Transaction failed')
          }
          
          return `✅ Successfully sent ${parsedCommand.amount} XLM to ${parsedCommand.contactName} (${contactAddress.slice(0, 8)}...${contactAddress.slice(-8)})\n💡 Contact was found in smart contract!`
          
        // === SMART CONTRACT COMMANDS ===
        case 'set_daily_limit':
          if (!parsedCommand.limit) {
            throw new Error('Daily limit amount is required')
          }
          
          try {
            console.log('Setting daily limit:', parsedCommand.limit, 'for:', publicKey);
            
            response = await fetch('/api/stellar/smart-limit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'set_daily_limit',
                publicKey,
                secretKey,
                dailyLimit: parsedCommand.limit
              })
            })
            
            const dailyLimitData = await response.json()
            console.log('Daily limit response:', dailyLimitData);
            
            if (!response.ok) {
              throw new Error(dailyLimitData.error || 'Failed to set daily limit')
            }
            
            return `🔒 Daily spending limit set to ${parsedCommand.limit} XLM via smart contract`
          } catch (limitError: any) {
            console.error('Daily limit error:', limitError);
            return `❌ Failed to set daily limit: ${limitError.message}`
          }
          
        case 'set_monthly_limit':
          if (!parsedCommand.limit) {
            throw new Error('Monthly limit amount is required')
          }
          
          response = await fetch('/api/stellar/smart-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'set_monthly_limit',
              publicKey,
              secretKey,
              monthlyLimit: parsedCommand.limit
            })
          })
          
          const monthlyLimitData = await response.json()
          if (!response.ok) {
            throw new Error(monthlyLimitData.error || 'Failed to set monthly limit')
          }
          
          return `🔒 Monthly spending limit set to ${parsedCommand.limit} XLM via smart contract`
          
        case 'freeze_wallet':
          try {
            console.log('Freezing wallet for:', publicKey);
            
            response = await fetch('/api/stellar/smart-limit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'freeze_wallet',
                publicKey,
                secretKey
              })
            })
            
            const freezeData = await response.json()
            console.log('Freeze response:', freezeData);
            
            if (!response.ok) {
              throw new Error(freezeData.error || 'Failed to freeze wallet')
            }
            
            return `🚨 Wallet has been FROZEN for security. All transactions are now blocked. Use "unfreeze my wallet" to restore access.`
          } catch (freezeError: any) {
            console.error('Freeze error:', freezeError);
            return `❌ Failed to freeze wallet: ${freezeError.message}`
          }
          
        case 'unfreeze_wallet':
          response = await fetch('/api/stellar/smart-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'unfreeze_wallet',
              publicKey,
              secretKey
            })
          })
          
          const unfreezeData = await response.json()
          if (!response.ok) {
            throw new Error(unfreezeData.error || 'Failed to unfreeze wallet')
          }
          
          return `✅ Wallet has been UNFROZEN. Transactions are now allowed again.`
          
        case 'get_spending_info':
          response = await fetch('/api/stellar/smart-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_spending_info',
              publicKey,
              secretKey
            })
          })
          
          const spendingData = await response.json()
          if (!response.ok) {
            throw new Error(spendingData.error || 'Failed to get spending info')
          }
          
          const contractSpendingInfo = spendingData.spendingInfo || {};
          return `📊 Smart Contract Spending Limits:\n• Daily: ${contractSpendingInfo.dailySpent || 0}/${contractSpendingInfo.dailyLimit || 1000} XLM\n• Monthly: ${contractSpendingInfo.monthlySpent || 0}/${contractSpendingInfo.monthlyLimit || 10000} XLM\n• Status: ${contractSpendingInfo.isFrozen ? '🔒 FROZEN' : '✅ Active'}`
          
        case 'reset_spending_limits':
          response = await fetch('/api/stellar/smart-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'reset_spending_limits',
              publicKey,
              secretKey
            })
          })
          
          const resetData = await response.json()
          if (!response.ok) {
            throw new Error(resetData.error || 'Failed to reset spending limits')
          }
          
          return `🔄 Spending limits have been reset. Daily and monthly counters are now at zero.`
          
        case 'set_contact_trusted':
          if (!parsedCommand.contactName) {
            throw new Error('Contact name is required')
          }
          
          response = await fetch('/api/stellar/smart-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'set_contact_trusted',
              publicKey,
              secretKey,
              contactName: parsedCommand.contactName,
              isTrusted: true
            })
          })
          
          const trustedData = await response.json()
          if (!response.ok) {
            throw new Error(trustedData.error || 'Failed to set contact as trusted')
          }
          
          return `✅ Contact "${parsedCommand.contactName}" is now marked as TRUSTED in smart contract.\n💡 Trusted contacts may get special permissions for transactions.`
          
        case 'get_spending_analytics':
          response = await fetch('/api/stellar/smart-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_spending_analytics',
              publicKey,
              secretKey
            })
          })
          
          const analyticsData = await response.json()
          if (!response.ok) {
            throw new Error(analyticsData.error || 'Failed to get analytics')
          }
          
          return `📈 Spending Analytics:\n• Daily spent: 0 XLM\n• Monthly spent: 0 XLM\n• Total transactions: 0\n• Smart contract: Active`

        // === MULTI-ASSET COMMANDS ===
        case 'get_portfolio':
          response = await fetch('/api/stellar/multi-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_portfolio',
              publicKey,
              secretKey
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Portfolio API error:', response.status, errorText)
            throw new Error(`Failed to get portfolio (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const portfolioData = await response.json()
          
          const portfolio = portfolioData.portfolio
          let portfolioText = `💼 Your Multi-Asset Portfolio:\n\n`
          
          Object.values(portfolio.assets).forEach((asset: any) => {
            const icon = asset.code === 'XLM' ? '⭐' : asset.code === 'USDC' ? '💵' : asset.code === 'EURC' ? '💶' : '🪙'
            portfolioText += `${icon} ${asset.code}: ${asset.balance.toFixed(4)} (≈${asset.valueXLM.toFixed(2)} XLM)\n`
          })
          
          portfolioText += `\n💰 Total Value: ${portfolio.totalValueXLM.toFixed(4)} XLM`
          portfolioText += `\n💵 ≈ $${(portfolio.totalValueXLM * 0.12).toFixed(2)} USD`
          
          return portfolioText

        case 'swap_tokens':
          if (!parsedCommand.fromAsset || !parsedCommand.toAsset || !parsedCommand.amount) {
            throw new Error('From asset, to asset, and amount are required for swapping')
          }
          
          // Handle Freighter wallet swaps (no secret key)
          if (!secretKey) {
            // Import Freighter functions
            const { signTransaction } = await import('@/lib/freighterWallet')
            
            // Create swap transaction XDR for Freighter to sign
            const transactionResponse = await fetch('/api/stellar/multi-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create_swap_transaction',
                publicKey,
                fromAsset: parsedCommand.fromAsset,
                toAsset: parsedCommand.toAsset,
                amount: parsedCommand.amount
              })
            })
            
            if (!transactionResponse.ok) {
              throw new Error('Failed to create swap transaction')
            }
            
            const { transactionXDR } = await transactionResponse.json()
            
            // Sign with Freighter
            const signedXDR = await signTransaction(transactionXDR, STELLAR_NETWORK_PASSPHRASE)
            
            // Submit signed transaction
            response = await fetch('/api/stellar/multi-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'execute_swap',
                publicKey,
                fromAsset: parsedCommand.fromAsset,
                toAsset: parsedCommand.toAsset,
                amount: parsedCommand.amount,
                signedTransaction: signedXDR
              })
            })
          } else {
            // Handle manual wallet swaps (with secret key)
            response = await fetch('/api/stellar/multi-asset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'execute_swap',
                publicKey,
                secretKey,
                fromAsset: parsedCommand.fromAsset,
                toAsset: parsedCommand.toAsset,
                amount: parsedCommand.amount
              })
            })
          }
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Swap API error:', response.status, errorText)
            throw new Error(`Swap failed (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const swapData = await response.json()
          
          return `✅ Swap Successful!\n🔄 ${parsedCommand.amount} ${parsedCommand.fromAsset} → ${parsedCommand.toAsset}\n💰 Transaction Hash: ${swapData.hash?.slice(0, 8)}...\n🎉 Your swap has been completed successfully!`

        case 'get_asset_prices':
          response = await fetch('/api/stellar/multi-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_asset_prices',
              publicKey,
              secretKey
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Prices API error:', response.status, errorText)
            throw new Error(`Failed to get prices (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const pricesData = await response.json()
          
          let pricesText = `💹 Current Asset Prices:\n\n`
          pricesData.prices.forEach((price: any) => {
            const icon = price.code === 'XLM' ? '⭐' : price.code === 'USDC' ? '💵' : price.code === 'EURC' ? '💶' : '🪙'
            const changeIcon = price.change24h > 0 ? '📈' : price.change24h < 0 ? '📉' : '➡️'
            pricesText += `${icon} ${price.code}: ${price.priceXLM.toFixed(4)} XLM ($${price.priceUSD.toFixed(4)}) ${changeIcon} ${price.change24h.toFixed(2)}%\n`
          })
          
          return pricesText

        case 'get_swap_history':
          response = await fetch('/api/stellar/multi-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_swap_history',
              publicKey,
              secretKey
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('History API error:', response.status, errorText)
            throw new Error(`Failed to get swap history (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const historyData = await response.json()
          
          if (historyData.swapHistory.length === 0) {
            return `📊 No swap history found.\n💡 Start swapping with: "Swap 10 XLM to USDC"`
          }
          
          let historyText = `📊 Recent Swap History:\n\n`
          historyData.swapHistory.slice(0, 5).forEach((swap: any) => {
            const fromIcon = swap.fromAsset === 'XLM' ? '⭐' : swap.fromAsset === 'USDC' ? '💵' : '🪙'
            const toIcon = swap.toAsset === 'XLM' ? '⭐' : swap.toAsset === 'USDC' ? '💵' : '🪙'
            const statusIcon = swap.status === 'completed' ? '✅' : '❌'
            historyText += `${statusIcon} ${fromIcon}${swap.amountIn.toFixed(2)} ${swap.fromAsset} → ${toIcon}${swap.amountOut?.toFixed(2) || '?'} ${swap.toAsset}\n`
            historyText += `   ${new Date(swap.timestamp).toLocaleDateString()}\n\n`
          })
          
          return historyText

        case 'calculate_swap':
          if (!parsedCommand.fromAsset || !parsedCommand.toAsset || !parsedCommand.amount) {
            throw new Error('From asset, to asset, and amount are required for calculation')
          }
          
          response = await fetch('/api/stellar/multi-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'calculate_swap',
              publicKey,
              secretKey,
              fromAsset: parsedCommand.fromAsset,
              toAsset: parsedCommand.toAsset,
              amount: parsedCommand.amount
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Calculation API error:', response.status, errorText)
            throw new Error(`Failed to calculate swap (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const calcData = await response.json()
          
          const calc = calcData.calculation
          return `🧮 Swap Calculation:\n\n💱 ${calc.amountIn} ${calc.fromAsset} → ${calc.amountOut.toFixed(4)} ${calc.toAsset}\n📊 Rate: 1 ${calc.fromAsset} = ${calc.rate.toFixed(4)} ${calc.toAsset}\n💸 Fee: ${calc.fee.toFixed(4)} ${calc.fromAsset} (0.3%)\n📉 Price Impact: ${calc.priceImpact.toFixed(2)}%\n🛡️ Minimum Received: ${calc.minimumReceived.toFixed(4)} ${calc.toAsset}\n\n💡 Execute with: "Swap ${calc.amountIn} ${calc.fromAsset} to ${calc.toAsset}"`

        case 'check_trustlines':
          response = await fetch('/api/stellar/multi-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'check_trustlines',
              publicKey,
              secretKey
            })
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Trustlines API error:', response.status, errorText)
            throw new Error(`Failed to check trustlines (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const trustlinesData = await response.json()
          const trustlines = trustlinesData.trustlines
          
          let trustlinesText = `🔗 Your Asset Trustlines:\n\n`
          
          if (trustlines.established.length > 0) {
            trustlinesText += `✅ Established Trustlines:\n`
            trustlines.established.forEach((asset: any) => {
              trustlinesText += `${asset.icon} ${asset.code}: ${parseFloat(asset.balance).toFixed(4)} ${asset.name}\n`
            })
            trustlinesText += `\n`
          }
          
          if (trustlines.missing.length > 0) {
            trustlinesText += `❌ Missing Trustlines:\n`
            trustlines.missing.forEach((asset: any) => {
              trustlinesText += `${asset.icon} ${asset.code}: ${asset.name} - ${asset.description}\n`
            })
            trustlinesText += `\n💡 To add trustlines:\n• Use Stellar Laboratory (laboratory.stellar.org)\n• Or use Freighter wallet\n• Switch to testnet mode for testing\n`
          }
          
          return trustlinesText

        case 'smart_suggestion':
          return generateSmartSuggestion(parsedCommand)
          
        default:
          throw new Error('Unknown command')
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Command failed')
      }
      
      // Format response based on action
      switch (parsedCommand.action) {
        case 'balance':
          return `Your current balance is ${data.balance} XLM`
          
        case 'history':
          if (data.transactions && data.transactions.length > 0) {
            const recent = data.transactions.slice(0, 5)
            return `Recent transactions:\n${recent.map((tx: any) => 
              `• ${tx.type}: ${tx.amount} XLM (${new Date(tx.created_at).toLocaleDateString()})`
            ).join('\n')}`
          } else {
            return 'No recent transactions found'
          }
          
        case 'send':
          return `Successfully sent ${parsedCommand.amount} XLM to ${parsedCommand.recipient}`
          
        default:
          return 'Command executed successfully'
      }
      
    } catch (error: any) {
      throw new Error(error.message || 'Failed to execute command')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    addMessage(userMessage, true)
    setLoading(true)

    try {
      // If there's a pending command waiting for confirmation
      if (pendingCommand) {
        const isYes = /^(yes|y|confirm|ok|sure|proceed|do it|yep|yeah)$/i.test(userMessage.trim())
        const isNo = /^(no|n|cancel|stop|abort|nope|nah)$/i.test(userMessage.trim())

        if (isYes) {
          setPendingCommand(null)
          const result = await executeCommand(pendingCommand)
          const conversationalResult = addConversationalTouch(result, pendingCommand)
          addMessage(conversationalResult, false)
          setLoading(false)
          return
        } else if (isNo) {
          setPendingCommand(null)
          addMessage('Cancelled. What else can I help you with?', false)
          setLoading(false)
          return
        } else {
          // User typed something else — clear pending and process as new command
          setPendingCommand(null)
        }
      }
      // Prepare context for AI
      const context = {
        hasWallet: !!publicKey,
        recentMessages: messages.slice(-5).map(m => ({ text: m.text, isUser: m.isUser })),
        contacts: contacts.map(c => c.name)
      }

      // Parse command with enhanced AI
      const parseResponse = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          command: userMessage,
          publicKey,
          context
        })
      })

      const parsedCommand = await parseResponse.json()
      console.log('Parsed command:', parsedCommand);
      
      if (!parseResponse.ok) {
        // Show helpful suggestions
        const errorMsg = parsedCommand.suggestions
          ? `I didn't quite get that. Try one of these:\n\n${parsedCommand.suggestions.map((s: string) => `• ${s}`).join('\n')}`
          : `I didn't understand that. Try saying "help" to see what I can do.`
        addMessage(errorMsg, false)
        return
      }

      // Handle commands requiring confirmation — store and ask
      if (parsedCommand.requiresConfirmation) {
        const confirmationMsg = generateConfirmationMessage(parsedCommand)
        setPendingCommand(parsedCommand)
        addMessage(confirmationMsg, false)
        return
      }

      // Execute the parsed command
      console.log('Executing command:', parsedCommand.action);
      const result = await executeCommand(parsedCommand)
      
      // Add conversational response
      const conversationalResult = addConversationalTouch(result, parsedCommand)
      addMessage(conversationalResult, false)
      
    } catch (error: any) {
      const friendlyError = makeFriendlyError(error.message, userMessage)
      addMessage(friendlyError, false)
    } finally {
      setLoading(false)
    }
  }

  const generateConfirmationMessage = (parsedCommand: any): string => {
    switch (parsedCommand.action) {
      case 'freeze_wallet':
        return `🚨 You want to freeze your wallet. This will block ALL transactions until you unfreeze it.\n\nAre you sure? Type 'yes' to confirm.`
      
      case 'send':
      case 'send_to_contact':
        const amount = parsedCommand.amount || 'some'
        const recipient = parsedCommand.contactName || parsedCommand.recipient?.slice(0, 8) + '...'
        return `💸 You want to send ${amount} ${parsedCommand.fromAsset || 'XLM'} to ${recipient}.\n\nShould I proceed? Type 'yes' to confirm.`
      
      case 'swap_tokens':
        return `🔄 You want to swap ${parsedCommand.amount || 'some'} ${parsedCommand.fromAsset} to ${parsedCommand.toAsset}.\n\nLet me calculate the rate first. Type 'yes' to proceed.`
      
      default:
        return `I want to make sure I understood correctly. You want me to ${parsedCommand.action.replace('_', ' ')}?\n\nType 'yes' to confirm.`
    }
  }

  const addConversationalTouch = (result: string, parsedCommand: any): string => {
    if (!parsedCommand.conversational) return result

    const conversationalPrefixes = [
      "Here's what I found:",
      "Got it! Here you go:",
      "Perfect! Here's the info:",
      "All set! Here's what you need:",
      "Done! Here are the details:"
    ]

    const randomPrefix = conversationalPrefixes[Math.floor(Math.random() * conversationalPrefixes.length)]
    return `${randomPrefix}\n\n${result}`
  }

  const makeFriendlyError = (error: string, originalCommand: string): string => {
    if (error.includes('trustline')) {
      return `🔗 Looks like you need to set up a trustline first!\n\n${error}\n\n💡 Try: "Check trustlines" to see what you need to set up.`
    }
    
    if (error.includes('balance')) {
      return `💰 Not enough funds for that transaction.\n\n${error}\n\n💡 Try: "What's my balance?" to check your available funds.`
    }
    
    if (error.includes('contact')) {
      return `👥 I couldn't find that contact.\n\n${error}\n\n💡 Try: "List contacts" to see who you have saved.`
    }
    
    return `Hmm, something went wrong: ${error}\n\n💡 You said: "${originalCommand}"\nTry rephrasing or ask for help!`
  }

  return (
    <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 via-black/5 to-white/5 border border-white/15 shadow-2xl animate-fade-in-scale">
      {/* Header */}
      <div className="border-b border-white/10 px-6 sm:px-12 py-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="text-3xl animate-float-gentle">🤖</div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/60 rounded-full animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
              <span className="px-2 py-1 text-xs rounded-full bg-white/20 text-gray-300">
                {messages.length} messages
              </span>
            </div>
            <p className="text-sm text-gray-400">Natural language wallet commands</p>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="h-[70vh] min-h-[500px] overflow-y-auto px-6 sm:px-12 py-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in-scale`}
            style={{animationDelay: `${index * 0.1}s`}}
          >
            <div className={`max-w-sm lg:max-w-lg relative flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                message.isUser 
                  ? 'bg-gradient-to-br from-white/30 to-black/30' 
                  : 'bg-gradient-to-br from-white/20 to-black/40'
              }`}>
                {message.isUser ? '👤' : '🤖'}
              </div>
              
              {/* Message Bubble */}
              <div
                className={`px-4 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                  message.isUser
                    ? 'bg-gradient-to-br from-white/20 to-black/20 border-white/30 rounded-br-md'
                    : 'bg-gradient-to-br from-white/15 to-black/25 border-white/25 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-line text-white leading-relaxed">{message.text}</p>
                <p className="text-xs opacity-70 mt-2 text-gray-300">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-fade-in-scale">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-white/25 to-black/35 flex items-center justify-center text-sm">
                🤖
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-gradient-to-br from-white/15 to-black/25 border border-white/25 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <p className="text-sm text-white/80 ml-2">AI is thinking...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t border-white/10 px-6 sm:px-12 py-6">
        <form onSubmit={handleSubmit} className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={getSmartPlaceholder()}
              className="w-full pl-12 pr-4 py-4 text-base rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300 backdrop-blur-sm relative z-10"
              disabled={loading}
              style={{ 
                minHeight: '56px',
                fontSize: '16px',
                lineHeight: '1.5',
                WebkitAppearance: 'none',
                appearance: 'none'
              }}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 text-lg pointer-events-none">
              💬
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="kiro-btn kiro-btn-primary px-6 py-4 rounded-2xl hover:scale-105 transition-all duration-300"
          >
            <span className="text-lg mr-2">{loading ? '⏳' : '🚀'}</span>
            Send
          </button>
        </form>
        
        {/* Quick Commands - Natural Language */}
        <div className="mt-4 flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Balance', cmd: "How much money do I have?" },
              { label: 'Portfolio', cmd: "Show my assets" },
              { label: 'Swap', cmd: "Trade some XLM for USDC" },
              { label: 'Safety', cmd: "Is my wallet safe?" },
              { label: 'Prices', cmd: "What are the current rates?" },
              { label: 'Help', cmd: "What can you help me with?" }
            ].map((item, index) => (
              <button
                key={item.label}
                onClick={() => setInput(item.cmd)}
                className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
                style={{animationDelay: `${index * 0.1}s`}}
                title={item.cmd}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          {/* Clear Chat Button */}
          <button
            onClick={clearChatHistory}
            className="px-3 py-1 text-xs rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 transition-all duration-300 hover:scale-105"
            title="Clear chat history"
          >
            🗑️ Clear
          </button>
        </div>
      </div>
    </div>
  )
}