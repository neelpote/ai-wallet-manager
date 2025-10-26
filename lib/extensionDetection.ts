// Advanced extension detection for installed wallets
export const detectInstalledExtensions = async () => {
  const extensions = {
    freighter: false,
    freighterInstalled: false,
    freighterInjected: false
  }

  if (typeof window === 'undefined') return extensions

  // Method 1: Check for injected API
  extensions.freighterInjected = !!(window as any).freighter

  // Method 2: Check for extension installation via Chrome APIs
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      // Try to detect Freighter extension ID
      const freighterExtensionId = 'bcacfldlkkdogcmkkibnjlakofdplcbk'
      
      // This will work if we can access extension info
      chrome.runtime.sendMessage(freighterExtensionId, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          // Extension not installed or not accessible
          extensions.freighterInstalled = false
        } else {
          // Extension responded, so it's installed
          extensions.freighterInstalled = true
        }
      })
    } catch (error) {
      // Can't access chrome.runtime or extension APIs
    }
  }

  // Method 3: Check for DOM markers that Freighter might inject
  const freighterMarkers = [
    'meta[name="freighter-extension"]',
    'script[src*="freighter"]',
    '[data-freighter]',
    '[data-extension-id*="freighter"]'
  ]

  const hasMarkers = freighterMarkers.some(selector => 
    document.querySelector(selector)
  )

  if (hasMarkers) {
    extensions.freighterInstalled = true
  }

  // Method 4: Check window properties that might indicate Freighter
  const windowChecks = [
    (window as any).freighter,
    (window as any).stellar,
    (window as any).__FREIGHTER_EXTENSION__,
    (window as any).FreighterApi
  ]

  if (windowChecks.some(check => !!check)) {
    extensions.freighter = true
    extensions.freighterInstalled = true
    extensions.freighterInjected = true
  }

  return extensions
}

// Force Freighter to inject by triggering common events
export const triggerFreighterInjection = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false

  // Method 1: Dispatch events that Freighter listens for
  const events = [
    'DOMContentLoaded',
    'load',
    'freighter-ready',
    'stellar-ready',
    'wallet-ready',
    'extension-ready'
  ]

  events.forEach(eventName => {
    window.dispatchEvent(new CustomEvent(eventName, {
      detail: { timestamp: Date.now(), source: 'ai-wallet-manager' }
    }))
  })

  // Method 2: Try to access extension directly
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    try {
      const freighterExtensionId = 'bcacfldlkkdogcmkkibnjlakofdplcbk'
      chrome.runtime.sendMessage(freighterExtensionId, { 
        action: 'inject',
        url: window.location.href 
      })
    } catch (error) {
      // Ignore errors
    }
  }

  // Method 3: Create DOM elements that might trigger injection
  const script = document.createElement('script')
  script.textContent = `
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('freighter-detection-request'));
      if (window.freighter) {
        window.dispatchEvent(new CustomEvent('freighter-found'));
      }
    }
  `
  document.head.appendChild(script)
  setTimeout(() => document.head.removeChild(script), 100)

  // Wait and check if Freighter appeared
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  return !!(window as any).freighter
}

// Check if user needs to open Freighter extension
export const needsFreighterActivation = async (): Promise<{
  installed: boolean
  injected: boolean
  needsActivation: boolean
  message: string
}> => {
  const extensions = await detectInstalledExtensions()
  
  if (extensions.freighterInjected) {
    return {
      installed: true,
      injected: true,
      needsActivation: false,
      message: 'Freighter is ready to use!'
    }
  }
  
  if (extensions.freighterInstalled) {
    return {
      installed: true,
      injected: false,
      needsActivation: true,
      message: 'Freighter is installed but needs to be opened. Click the Freighter icon in your browser toolbar.'
    }
  }
  
  return {
    installed: false,
    injected: false,
    needsActivation: false,
    message: 'Freighter extension is not installed. Please install it from the Chrome Web Store.'
  }
}