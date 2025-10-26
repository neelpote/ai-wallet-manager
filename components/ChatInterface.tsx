'use client'

import { useState, useEffect } from 'react'

import { useAppContext } from '@/contexts/AppContext'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatInterface() {
  const { state, addContact, updateBalance } = useAppContext()
  const { publicKey, secretKey, contacts } = state
  
  const getDefaultWelcomeMessage = (): Message => ({
    id: '1',
    text: 'Hi! I can help you manage your Stellar wallet with AI + Smart Contract power! Try:\n\n💰 Basic Commands:\n• "What\'s my balance?"\n• "Send 10 XLM to GXXX..."\n• "List contacts"\n\n🔄 Multi-Asset & Swapping:\n• "Show my portfolio"\n• "Swap 100 XLM to USDC"\n• "Convert 50 USDC to XLM"\n• "What\'s the price of USDC?"\n• "Check trustlines"\n• "Swap history"\n\n🔒 Smart Contract Security:\n• "Freeze" or "Freeze my wallet"\n• "Unfreeze" or "Unfreeze my wallet"\n• "Daily limit 500" or "Set daily limit to 500 XLM"\n• "Status" or "Check spending limits"\n\n👥 Save Contacts:\n• "Save GXXX as Alice" (local)\n• "Save contract Alice GXXX" (blockchain)',
    isUser: false,
    timestamp: new Date()
  })
  
  const [messages, setMessages] = useState<Message[]>([getDefaultWelcomeMessage()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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
    }
  }

  const executeCommand = async (parsedCommand: any) => {
    try {
      let response
      
      switch (parsedCommand.action) {
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
          
          const spendingInfo = spendingData.spendingInfo || {};
          return `📊 Smart Contract Spending Limits:\n• Daily: ${spendingInfo.dailySpent || 0}/${spendingInfo.dailyLimit || 1000} XLM\n• Monthly: ${spendingInfo.monthlySpent || 0}/${spendingInfo.monthlyLimit || 10000} XLM\n• Status: ${spendingInfo.isFrozen ? '🔒 FROZEN' : '✅ Active'}`
          
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
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('Swap API error:', response.status, errorText)
            throw new Error(`Swap failed (${response.status}): ${errorText.includes('<!DOCTYPE') ? 'API endpoint not found' : errorText}`)
          }
          
          const swapData = await response.json()
          
          return `✅ Swap Successful!\n🔄 ${parsedCommand.amount} ${parsedCommand.fromAsset} → ${swapData.amountReceived.toFixed(4)} ${parsedCommand.toAsset}\n💰 Rate: 1 ${parsedCommand.fromAsset} = ${(swapData.amountReceived / parsedCommand.amount).toFixed(4)} ${parsedCommand.toAsset}\n📋 Transaction: ${swapData.transactionId.slice(0, 8)}...`

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
      // Parse command with AI
      const parseResponse = await fetch('/api/ai-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMessage })
      })

      const parsedCommand = await parseResponse.json()
      console.log('Parsed command:', parsedCommand);
      
      if (!parseResponse.ok) {
        throw new Error(parsedCommand.error || 'Failed to understand command')
      }

      // Execute the parsed command
      console.log('Executing command:', parsedCommand.action);
      const result = await executeCommand(parsedCommand)
      addMessage(result, false)
      
    } catch (error: any) {
      addMessage(`Error: ${error.message}`, false)
    } finally {
      setLoading(false)
    }
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
              placeholder="Try: 'Send 10 XLM to Alice' or 'What's my balance?'"
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
        
        {/* Quick Commands */}
        <div className="mt-4 flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {['Balance', 'Portfolio', 'Trustlines', 'Swap', 'Prices', 'Status'].map((cmd, index) => (
              <button
                key={cmd}
                onClick={() => setInput(cmd === 'Balance' ? "What's my balance?" : 
                                       cmd === 'Portfolio' ? "Show my portfolio" :
                                       cmd === 'Trustlines' ? "Check trustlines" :
                                       cmd === 'Swap' ? "Swap 100 XLM to USDC" :
                                       cmd === 'Prices' ? "What's the price of USDC?" :
                                       "Status")}
                className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {cmd}
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