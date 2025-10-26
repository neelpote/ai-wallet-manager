// Environment compatibility check for wallet extensions
export const checkEnvironment = () => {
  if (typeof window === 'undefined') {
    return { compatible: false, reason: 'Server-side rendering' }
  }

  const checks = {
    isHttps: window.location.protocol === 'https:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isChrome: navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edg'),
    hasExtensionSupport: typeof chrome !== 'undefined' || typeof browser !== 'undefined'
  }

  // Extensions work on HTTPS or localhost
  const protocolOk = checks.isHttps || checks.isLocalhost
  
  if (!checks.isChrome) {
    return { 
      compatible: false, 
      reason: 'Browser not supported. Please use Chrome, Edge, or Brave.',
      checks 
    }
  }

  if (!protocolOk) {
    return { 
      compatible: false, 
      reason: 'Extensions require HTTPS or localhost.',
      checks 
    }
  }

  return { 
    compatible: true, 
    reason: 'Environment is compatible with wallet extensions.',
    checks 
  }
}

export const getEnvironmentInfo = () => {
  if (typeof window === 'undefined') return 'Server-side'
  
  const info = []
  info.push(`Protocol: ${window.location.protocol}`)
  info.push(`Host: ${window.location.hostname}`)
  info.push(`Browser: ${navigator.userAgent.includes('Chrome') ? 'Chrome-based' : 'Other'}`)
  
  return info.join(' | ')
}