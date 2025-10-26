'use client'

import { useState, useEffect } from 'react'

export default function FreighterInstallGuide() {
  const [showGuide, setShowGuide] = useState(false)
  const [step, setStep] = useState(1)
  const [freighterDetected, setFreighterDetected] = useState(false)

  useEffect(() => {
    // Check for Freighter periodically
    const checkFreighter = () => {
      const detected = !!(window as any).freighter
      setFreighterDetected(detected)
      if (detected && showGuide) {
        setStep(4) // Success step
      }
    }

    checkFreighter()
    const interval = setInterval(checkFreighter, 2000)
    return () => clearInterval(interval)
  }, [showGuide])

  if (!showGuide) {
    return (
      <div className="text-center mt-6">
        <button
          onClick={() => setShowGuide(true)}
          className="kiro-btn kiro-btn-ghost text-sm"
        >
          📖 Need help installing Freighter?
        </button>
      </div>
    )
  }

  const steps = [
    {
      title: "Install Freighter Extension",
      content: (
        <div className="space-y-3">
          <p>Click the button below to install Freighter from the Chrome Web Store:</p>
          <a
            href="https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block kiro-btn kiro-btn-primary"
          >
            🚀 Install Freighter Extension
          </a>
          <p className="text-sm text-gray-400">
            After installation, you should see the Freighter icon in your browser toolbar.
          </p>
        </div>
      )
    },
    {
      title: "Open Freighter",
      content: (
        <div className="space-y-3">
          <p>Click the Freighter icon in your browser toolbar to open it:</p>
          <div className="bg-white/10 p-3 rounded">
            <p className="text-sm">Look for the 🚀 Freighter icon in your browser toolbar (usually top-right)</p>
          </div>
          <p className="text-sm text-gray-400">
            If you don't see it, click the puzzle piece icon and pin Freighter.
          </p>
        </div>
      )
    },
    {
      title: "Setup for Testnet",
      content: (
        <div className="space-y-3">
          <p>In Freighter, make sure you're set up for testnet:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Create a new wallet or import existing keys</li>
            <li>Click Settings (gear icon)</li>
            <li>Select "Testnet" from the network dropdown</li>
            <li>Make sure you're logged in</li>
          </ol>
        </div>
      )
    },
    {
      title: "Success! 🎉",
      content: (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-semibold">Freighter detected successfully!</p>
          </div>
          <p className="text-sm text-gray-400">
            You can now close this guide and try connecting with Freighter.
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="mt-6 kiro-card max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Freighter Setup Guide</h3>
        <button
          onClick={() => setShowGuide(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center mb-6">
        {steps.map((_, index) => (
          <div key={index} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              index + 1 <= step ? 'bg-blue-500 text-white' : 'bg-white/20 text-gray-400'
            }`}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 ${
                index + 1 < step ? 'bg-blue-500' : 'bg-white/20'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Current step */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-3">
          Step {step}: {steps[step - 1].title}
        </h4>
        {steps[step - 1].content}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="kiro-btn kiro-btn-ghost disabled:opacity-50"
        >
          ← Previous
        </button>
        
        <div className="flex gap-2">
          {freighterDetected && step < 4 && (
            <button
              onClick={() => setStep(4)}
              className="kiro-btn kiro-btn-success"
            >
              ✅ Freighter Detected!
            </button>
          )}
          
          {step < 4 && !freighterDetected && (
            <button
              onClick={() => setStep(Math.min(4, step + 1))}
              className="kiro-btn kiro-btn-primary"
            >
              Next →
            </button>
          )}
          
          {step === 4 && (
            <button
              onClick={() => setShowGuide(false)}
              className="kiro-btn kiro-btn-success"
            >
              Done! 🎉
            </button>
          )}
        </div>
      </div>

      {/* Auto-detection status */}
      <div className="mt-4 p-3 bg-white/5 rounded text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${freighterDetected ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`} />
          <span>
            {freighterDetected ? 
              'Freighter detected and ready!' : 
              'Waiting for Freighter... (auto-detecting)'
            }
          </span>
        </div>
      </div>
    </div>
  )
}