'use client'

import { useState } from 'react'

export default function Help() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const helpSections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'ai-commands', title: 'AI Commands', icon: '🤖' },
    { id: 'spending-limits', title: 'Spending Limits', icon: '💰' },
    { id: 'security', title: 'Security', icon: '🔒' },
    { id: 'smart-contracts', title: 'Smart Contracts', icon: '📋' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' }
  ]

  const aiCommands = [
    {
      category: 'Basic Wallet Operations',
      commands: [
        { command: '"What\'s my balance?"', description: 'Check your current XLM balance' },
        { command: '"Send 10 XLM to GXXX..."', description: 'Send XLM to a Stellar address' },
        { command: '"Show my transaction history"', description: 'View recent transactions' },
        { command: '"Fund my testnet account"', description: 'Add test XLM to your account' }
      ]
    },
    {
      category: 'Contact Management',
      commands: [
        { command: '"Save GXXX as Alice"', description: 'Save a contact locally' },
        { command: '"Save GXXX as Alice to contract"', description: 'Save contact to smart contract' },
        { command: '"Send 5 XLM to Alice"', description: 'Send to a saved contact' },
        { command: '"List contacts"', description: 'Show all saved contacts' }
      ]
    },
    {
      category: 'Spending Limits',
      commands: [
        { command: '"Set daily limit to 500 XLM"', description: 'Set daily spending limit' },
        { command: '"Set monthly limit to 5000 XLM"', description: 'Set monthly spending limit' },
        { command: '"Status" or "Check spending limits"', description: 'View current limits and usage' },
        { command: '"Reset my spending limits"', description: 'Reset spending counters to zero' }
      ]
    },
    {
      category: 'Security Controls',
      commands: [
        { command: '"Freeze my wallet"', description: 'Block all transactions for security' },
        { command: '"Unfreeze my wallet"', description: 'Restore wallet functionality' },
        { command: '"Show my spending analytics"', description: 'View detailed spending analysis' }
      ]
    }
  ]

  const troubleshootingItems = [
    {
      problem: 'Transaction failed or was rejected',
      solutions: [
        'Check if you have sufficient balance for the transaction + fees',
        'Verify the recipient address is correct and exists',
        'Ensure your spending limits allow the transaction amount',
        'Check if your wallet is frozen in the Security section',
        'Try refreshing your balance and trying again'
      ]
    },
    {
      problem: 'AI commands not working',
      solutions: [
        'Make sure you\'re connected to your wallet (keys entered)',
        'Try rephrasing your command in simpler terms',
        'Check the AI Commands section for exact syntax',
        'Ensure you\'re using valid Stellar addresses (start with G)',
        'Try using the manual interface if AI parsing fails'
      ]
    },
    {
      problem: 'Smart contract features not responding',
      solutions: [
        'Test the smart contract connection in the Smart Contracts page',
        'Refresh the page and try again',
        'Check that both public and secret keys are entered correctly',
        'Verify you\'re on the Stellar testnet',
        'Contact support if the issue persists'
      ]
    },
    {
      problem: 'Cannot fund testnet account',
      solutions: [
        'Use the "Fund Testnet" button in the wallet header',
        'Try the Stellar Friendbot directly at friendbot.stellar.org',
        'Ensure you\'re using a valid testnet address',
        'Wait a few moments and refresh your balance',
        'Create a new testnet account if the current one has issues'
      ]
    }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div className="kiro-card">
              <h3 className="text-xl font-semibold mb-4 kiro-text-gradient">🚀 Welcome to AI Wallet Manager</h3>
              <div className="space-y-4 text-gray-300">
                <p>
                  AI Wallet Manager is a next-generation Stellar wallet that combines artificial intelligence 
                  with smart contract security to provide an intuitive and secure cryptocurrency experience.
                </p>
                
                <h4 className="text-lg font-semibold text-white">Key Features:</h4>
                <ul className="space-y-2 ml-4">
                  <li>• 🤖 <strong>Natural Language Commands</strong> - Control your wallet with plain English</li>
                  <li>• 💰 <strong>Smart Spending Limits</strong> - Automated daily and monthly controls</li>
                  <li>• 🔒 <strong>Advanced Security</strong> - Wallet freezing and emergency controls</li>
                  <li>• 📋 <strong>Smart Contracts</strong> - Blockchain-based security and automation</li>
                  <li>• 📊 <strong>Analytics</strong> - Detailed spending insights and health monitoring</li>
                </ul>
              </div>
            </div>

            <div className="kiro-card">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">📝 Quick Start Guide</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-semibold text-white">Connect Your Wallet</h4>
                    <p className="text-sm text-gray-400">Enter your Stellar testnet public and secret keys in the wallet header</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">2</div>
                  <div>
                    <h4 className="font-semibold text-white">Fund Your Account</h4>
                    <p className="text-sm text-gray-400">Use the "Fund Testnet" button to get test XLM for transactions</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">3</div>
                  <div>
                    <h4 className="font-semibold text-white">Try AI Commands</h4>
                    <p className="text-sm text-gray-400">Start with "What\'s my balance?" in the AI chat interface</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">4</div>
                  <div>
                    <h4 className="font-semibold text-white">Set Up Security</h4>
                    <p className="text-sm text-gray-400">Configure spending limits and security settings for protection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'ai-commands':
        return (
          <div className="space-y-6">
            {aiCommands.map((category, index) => (
              <div key={index} className="kiro-card">
                <h3 className="text-lg font-semibold mb-4 kiro-text-gradient">{category.category}</h3>
                <div className="space-y-3">
                  {category.commands.map((cmd, cmdIndex) => (
                    <div key={cmdIndex} className="kiro-glass p-3 rounded-lg">
                      <div className="font-mono text-sm text-purple-300 mb-1">{cmd.command}</div>
                      <div className="text-sm text-gray-400">{cmd.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="kiro-card">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">💡 AI Command Tips</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Commands are case-insensitive and flexible with phrasing</p>
                <p>• You can use "XLM" or "XML" (common typo) in amount commands</p>
                <p>• Stellar addresses must start with "G" and be 56 characters long</p>
                <p>• Contact names are saved and can be used in future transactions</p>
                <p>• The AI will provide helpful error messages if commands fail</p>
              </div>
            </div>
          </div>
        )

      case 'spending-limits':
        return (
          <div className="space-y-6">
            <div className="kiro-card">
              <h3 className="text-xl font-semibold mb-4 kiro-text-gradient">💰 Understanding Spending Limits</h3>
              <div className="space-y-4 text-gray-300">
                <p>
                  Spending limits provide an additional layer of security by automatically blocking 
                  transactions that exceed your predefined daily or monthly allowances.
                </p>
                
                <h4 className="text-lg font-semibold text-white">How They Work:</h4>
                <ul className="space-y-2 ml-4">
                  <li>• Limits are enforced before transactions reach the Stellar network</li>
                  <li>• Daily limits reset at midnight UTC</li>
                  <li>• Monthly limits reset on the 1st of each month</li>
                  <li>• Counters can be manually reset at any time</li>
                  <li>• Frozen wallets block all transactions regardless of limits</li>
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="kiro-card">
                <h3 className="text-lg font-semibold mb-4 text-blue-400">📅 Daily Limits</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p><strong>Purpose:</strong> Control day-to-day spending</p>
                  <p><strong>Recommended:</strong> 10-20% of monthly income</p>
                  <p><strong>Reset:</strong> Every day at midnight UTC</p>
                  <p><strong>Use Case:</strong> Prevent unauthorized daily transactions</p>
                </div>
              </div>

              <div className="kiro-card">
                <h3 className="text-lg font-semibold mb-4 text-green-400">📊 Monthly Limits</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  <p><strong>Purpose:</strong> Long-term spending control</p>
                  <p><strong>Recommended:</strong> 50-80% of available funds</p>
                  <p><strong>Reset:</strong> 1st day of each month</p>
                  <p><strong>Use Case:</strong> Prevent large unauthorized transfers</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div className="kiro-card">
              <h3 className="text-xl font-semibold mb-4 kiro-text-gradient">🔒 Security Best Practices</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">🔐 Key Security</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Never share your secret key with anyone</li>
                    <li>• Store secret keys offline in multiple secure locations</li>
                    <li>• Use hardware wallets for large amounts</li>
                    <li>• Only use HTTPS websites for wallet access</li>
                    <li>• Regularly backup your wallet information</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">🚨 Emergency Features</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>• Wallet freezing blocks all transactions instantly</li>
                    <li>• Emergency contacts can freeze (but not unfreeze) your wallet</li>
                    <li>• Spending limits provide automatic protection</li>
                    <li>• Transaction logging helps track suspicious activity</li>
                    <li>• Smart contracts enforce security rules automatically</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="kiro-card">
              <h3 className="text-lg font-semibold mb-4 text-red-400">⚠️ Security Warnings</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p><strong>Testnet Only:</strong> This wallet is for development purposes. Never use mainnet keys or real funds.</p>
                </div>
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p><strong>Browser Security:</strong> Clear browser data when finished. Don't use on shared computers.</p>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p><strong>Phishing Protection:</strong> Always verify you're on the correct website before entering keys.</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'smart-contracts':
        return (
          <div className="space-y-6">
            <div className="kiro-card">
              <h3 className="text-xl font-semibold mb-4 kiro-text-gradient">📋 Smart Contract Features</h3>
              <div className="space-y-4 text-gray-300">
                <p>
                  Smart contracts provide automated, trustless security features that operate 
                  independently of traditional wallet interfaces.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">🛡️ Security Features</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Automated spending limit enforcement</li>
                      <li>• Emergency wallet freezing capabilities</li>
                      <li>• Trusted contact management</li>
                      <li>• Transaction validation and logging</li>
                      <li>• Immutable security rule enforcement</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">⚡ Automation Benefits</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Rules cannot be bypassed or disabled</li>
                      <li>• Operates 24/7 without human intervention</li>
                      <li>• Transparent and auditable operations</li>
                      <li>• Cross-device consistency</li>
                      <li>• Blockchain-level security guarantees</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="kiro-card">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">🔧 Development Note</h3>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm text-gray-300">
                  <strong>Current Implementation:</strong> This version uses a simulated smart contract 
                  for development and testing purposes. In a production environment, these features 
                  would be deployed as actual Soroban smart contracts on the Stellar blockchain, 
                  providing true decentralized security and automation.
                </p>
              </div>
            </div>
          </div>
        )

      case 'troubleshooting':
        return (
          <div className="space-y-6">
            {troubleshootingItems.map((item, index) => (
              <div key={index} className="kiro-card">
                <h3 className="text-lg font-semibold mb-4 text-red-400">🔧 {item.problem}</h3>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Solutions:</h4>
                  <ul className="space-y-1 text-sm text-gray-300 ml-4">
                    {item.solutions.map((solution, sIndex) => (
                      <li key={sIndex}>• {solution}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            
            <div className="kiro-card">
              <h3 className="text-lg font-semibold mb-4 text-green-400">📞 Additional Support</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p>If you continue to experience issues:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Check the browser console for error messages (F12)</li>
                  <li>• Try refreshing the page and reconnecting your wallet</li>
                  <li>• Ensure you're using a modern browser with JavaScript enabled</li>
                  <li>• Verify your internet connection is stable</li>
                  <li>• Contact the development team with specific error details</li>
                </ul>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="kiro-card-premium kiro-animate-slideUp">
        <div className="text-center">
          <h1 className="text-3xl font-bold kiro-text-gradient mb-4">❓ Help & Documentation</h1>
          <p className="text-gray-300">
            Everything you need to know about using AI Wallet Manager
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="kiro-card sticky top-6">
            <h3 className="text-lg font-semibold mb-4 kiro-text-gradient">📚 Topics</h3>
            <nav className="space-y-2">
              {helpSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? 'kiro-glass-heavy border border-purple-400/50 kiro-text-gradient'
                      : 'hover:kiro-glass hover:border hover:border-white/20 text-gray-300'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}