'use client'

export default function WalletInstructions() {
  return (
    <div className="mt-8 space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-semibold text-white mb-4">🚀 Getting Started</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="kiro-card text-center p-6">
          <div className="text-4xl mb-4">🚀</div>
          <h5 className="font-bold text-white mb-2">Freighter Wallet</h5>
          <p className="text-sm text-gray-400 mb-3">
            Browser extension wallet with the best security and user experience
          </p>
          <a
            href="https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Install Freighter →
          </a>
        </div>

        <div className="kiro-card text-center p-6">
          <div className="text-4xl mb-4">⭐</div>
          <h5 className="font-bold text-white mb-2">Albedo Wallet</h5>
          <p className="text-sm text-gray-400 mb-3">
            Web-based wallet that works directly in your browser
          </p>
          <a
            href="https://albedo.link"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Open Albedo →
          </a>
        </div>

        <div className="kiro-card text-center p-6">
          <div className="text-4xl mb-4">🔑</div>
          <h5 className="font-bold text-white mb-2">Manual Entry</h5>
          <p className="text-sm text-gray-400 mb-3">
            Enter your Stellar keys manually or generate new testnet keys
          </p>
          <span className="text-gray-500 text-sm">
            Always available
          </span>
        </div>
      </div>

      <div className="kiro-card p-6">
        <div className="flex items-start gap-4">
          <div className="text-2xl">💡</div>
          <div>
            <h5 className="font-semibold text-white mb-2">Pro Tips</h5>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Freighter</strong> is recommended for the best security and ease of use</li>
              <li>• <strong>Albedo</strong> works great if you don't want to install an extension</li>
              <li>• <strong>Manual Entry</strong> is perfect for testing with generated keys</li>
              <li>• All wallets work with Stellar's testnet for safe development</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}