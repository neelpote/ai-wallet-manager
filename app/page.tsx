'use client'

import WalletHeader from '@/components/WalletHeader'
import Navbar from '@/components/Navbar'
import Dashboard from '@/components/pages/Dashboard'
import SpendingLimits from '@/components/pages/SpendingLimits'
import Security from '@/components/pages/Security'
import SmartContracts from '@/components/pages/SmartContracts'
import Analytics from '@/components/pages/Analytics'
import Help from '@/components/pages/Help'


import { useAppContext } from '@/contexts/AppContext'

export default function Home() {
  const { state, setActiveTab } = useAppContext()
  const { publicKey, secretKey, activeTab } = state

  const renderPage = () => {
    if (!publicKey || !secretKey) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-screen px-6">
          <div className="text-center space-y-8 max-w-4xl w-full animate-slide-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="kiro-card text-center p-6 animate-fade-in-scale hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
                <div className="text-4xl mb-4 animate-float-gentle">🤖</div>
                <h3 className="font-bold text-white mb-3 text-lg">AI Assistant</h3>
                <p className="text-gray-400 leading-relaxed">Natural language commands for seamless wallet management</p>
              </div>
              <div className="kiro-card text-center p-6 animate-fade-in-scale hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
                <div className="text-4xl mb-4 animate-float-gentle" style={{animationDelay: '1s'}}>🔒</div>
                <h3 className="font-bold text-white mb-3 text-lg">Smart Security</h3>
                <p className="text-gray-400 leading-relaxed">Automated spending limits and wallet freeze protection</p>
              </div>
              <div className="kiro-card text-center p-6 animate-fade-in-scale hover:scale-105 transition-all duration-300" style={{animationDelay: '0.3s'}}>
                <div className="text-4xl mb-4 animate-float-gentle" style={{animationDelay: '2s'}}>📊</div>
                <h3 className="font-bold text-white mb-3 text-lg">Analytics</h3>
                <p className="text-gray-400 leading-relaxed">Transaction insights and spending analytics</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'spending':
        return <SpendingLimits />
      case 'security':
        return <Security />
      case 'contracts':
        return <SmartContracts />
      case 'analytics':
        return <Analytics />
      case 'help':
        return <Help />
      default:
        return <Dashboard />
    }
  }

  const isLoggedIn = publicKey && secretKey

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-gray-900 to-black modern-mesh-bg">
      {/* Sidebar Navigation - Only show when logged in */}
      <div className={`transition-all duration-500 ease-in-out ${isLoggedIn ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        {isLoggedIn && (
          <Navbar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            publicKey={publicKey}
          />
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Always show but with different styling for login */}
        <div className={`border-b border-white/10 backdrop-blur-xl bg-gradient-to-r from-white/5 via-black/10 to-white/5 ${!isLoggedIn ? 'border-b-0' : ''}`}>
          <div className={`${isLoggedIn ? 'p-6' : 'p-8'}`}>
            <WalletHeader />
          </div>
        </div>
        
        {/* Page Content */}
        <div className={`flex-1 ${isLoggedIn ? 'p-6' : 'p-0'}`}>
          <div className={`${isLoggedIn ? 'max-w-7xl mx-auto' : 'w-full'}`}>
            {renderPage()}
          </div>
        </div>
      </div>
      

    </div>
  )
}