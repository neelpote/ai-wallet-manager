// Enhanced Freighter detection with multiple methods
export const detectFreighter = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Primary check: Look for Freighter API
  if ((window as any).freighter) {
    return true
  }
  
  // Secondary checks for alternative injection methods
  const alternativeChecks = [
    !!(window as any).stellar,
    !!(window as any).FreighterApi,
    'freighter' in window,
    // Check if extension injected any Stellar-related objects
    !!(window as any).StellarSdk,
    // Check for common extension markers
    !!document.querySelector('meta[name="freighter-extension"]'),
    !!document.querySelector('[data-freighter]')
  ]
  
  return alternativeChecks.some(check => check)
}

export const waitForFreighter = (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    // First check immediately
    if (detectFreighter()) {
      resolve(true)
      return
    }

    let attempts = 0
    const maxAttempts = timeout / 200 // Check every 200ms

    const checkInterval = setInterval(() => {
      attempts++
      
      if (detectFreighter()) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 200)
  })
}



export const getFreighterAPI = () => {
  if (typeof window === 'undefined') return null
  
  // Try multiple possible locations
  return (window as any).freighter || 
         (window as any).stellar || 
         (window as any).FreighterApi || 
         null
}

// Force trigger Freighter injection (sometimes needed)
export const triggerFreighterInjection = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    // Dispatch a custom event that might trigger Freighter injection
    const event = new CustomEvent('freighter-detection', { detail: { timestamp: Date.now() } })
    window.dispatchEvent(event)

    // Also try to access chrome.runtime if available
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        // This might trigger extension content script injection
        chrome.runtime.sendMessage('freighter-extension-id', { action: 'ping' }, () => {
          // Ignore response, just trying to trigger injection
        })
      } catch (error) {
        // Ignore errors, this is just a trigger attempt
      }
    }

    // Wait a bit and check again
    setTimeout(() => {
      resolve(detectFreighter())
    }, 1000)
  })
}