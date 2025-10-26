// Content Security Policy configuration for wallet extensions
export const getCSPForEnvironment = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    // More permissive CSP for development with wallet extensions
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension: moz-extension: webkit-extension: blob:",
      "style-src 'self' 'unsafe-inline' chrome-extension: moz-extension:",
      "img-src 'self' data: https: http: chrome-extension: moz-extension: blob:",
      "font-src 'self' data: https: chrome-extension: moz-extension:",
      "connect-src 'self' https: http: ws: wss: chrome-extension: moz-extension: blob:",
      "frame-src 'self' https: http: chrome-extension: moz-extension:",
      "worker-src 'self' blob:",
      "child-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  } else {
    // Stricter CSP for production
    return [
      "default-src 'self'",
      "script-src 'self' chrome-extension: moz-extension:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://horizon-testnet.stellar.org https://friendbot.stellar.org",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
}

export const walletExtensionCSP = {
  // Allow wallet extensions to inject scripts
  scriptSrc: "'self' 'unsafe-eval' 'unsafe-inline' chrome-extension: moz-extension: webkit-extension:",
  
  // Allow wallet extensions to load styles
  styleSrc: "'self' 'unsafe-inline' chrome-extension: moz-extension:",
  
  // Allow wallet extensions to make network requests
  connectSrc: "'self' https: wss: chrome-extension: moz-extension:",
  
  // Allow wallet extensions to load resources
  imgSrc: "'self' data: https: chrome-extension: moz-extension:",
  fontSrc: "'self' data: chrome-extension: moz-extension:"
}