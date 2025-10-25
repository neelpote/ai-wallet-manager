'use client'

import { useState } from 'react'

interface ChatInterfaceProps {
  publicKey: string
  secretKey: string
}

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function ChatInterface({ publicKey, secretKey }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I can help you manage your Stellar wallet with AI + Smart Contract power! Try:\n\n💰 Basic Commands:\n• "What\'s my balance?"\n• "Send 10 XLM to GXXX..."\n• "List contacts"\n\n🔒 Smart Contract Security:\n• "Freeze" or "Freeze my wallet"\n• "Unfreeze" or "Unfreeze my wallet"\n• "Daily limit 500" or "Set daily limit to 500 XLM"\n• "Status" or "Check spending limits"\n\n👥 Save Contacts:\n• "Save GXXX as Alice" (local)\n• "Save contract Alice GXXX" (blockchain)',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

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
    const contacts = JSON.parse(localStorage.getItem(`contacts_${publicKey}`) || '{}')
    contacts[name.toLowerCase()] = address
    localStorage.setItem(`contacts_${publicKey}`, JSON.stringify(contacts))
  }

  const getContact = async (name: string): Promise<string | null> => {
    // First check local contacts
    const contacts = JSON.parse(localStorage.getItem(`contacts_${publicKey}`) || '{}')
    const localContact = contacts[name.toLowerCase()];
    
    if (localContact) {
      return localContact;
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
    const contacts = JSON.parse(localStorage.getItem(`contacts_${publicKey}`) || '{}')
    const localContactList = Object.entries(contacts)
    
    let result = '';
    
    if (localContactList.length > 0) {
      result += `📱 Local Contacts:\n${localContactList.map(([name, address]) => 
        `• ${name}: ${(address as string).slice(0, 8)}...${(address as string).slice(-8)}`
      ).join('\n')}\n\n`;
    }
    
    // Try to get smart contract contacts (this is a simplified approach)
    result += `🔗 Smart Contract Contacts:\n💡 Use "Send 10 XLM to contactname" to send to any saved contact\n💡 Contacts saved via Smart Contract Manager are also available`;
    
    if (localContactList.length === 0) {
      result = 'No local contacts saved yet.\n\n💡 Save contacts:\n• Local: "Save GXXX as John"\n• Smart Contract: Use the Smart Contract Manager interface\n\n🔗 Smart contract contacts are automatically available for sending!';
    }
    
    return result;
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
          // Store limit in localStorage for now
          localStorage.setItem('spending_limit', parsedCommand.limit.toString())
          return `Spending limit set to ${parsedCommand.limit} XLM`
          
        case 'check_limit':
          const limit = localStorage.getItem('spending_limit')
          return limit ? `Current spending limit: ${limit} XLM` : 'No spending limit set'
          
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
            <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
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
              className="w-full kiro-input pl-12 pr-4 py-4 text-base rounded-2xl"
              disabled={loading}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
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
        <div className="mt-4 flex flex-wrap gap-2">
          {['Balance', 'Send XLM', 'Set Limit', 'Status'].map((cmd, index) => (
            <button
              key={cmd}
              onClick={() => setInput(cmd === 'Balance' ? "What's my balance?" : 
                                   cmd === 'Send XLM' ? "Send 10 XLM to " :
                                   cmd === 'Set Limit' ? "Set daily limit to 500 XLM" :
                                   "Status")}
              className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}