/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14

  // Configure headers for wallet extension compatibility
  async headers() {
    // In development, temporarily allow 'unsafe-eval' for wallet extensions
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                "script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension: moz-extension:",
                "style-src 'self' 'unsafe-inline'",
                "connect-src 'self' https://horizon-testnet.stellar.org https://friendbot.stellar.org chrome-extension: moz-extension:",
                "img-src 'self' data: https:",
                "frame-src 'self' chrome-extension: moz-extension:"
              ].join('; ')
            }
          ]
        }
      ]
    }

    // Production CSP (more restrictive)
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension: moz-extension:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://horizon-testnet.stellar.org https://friendbot.stellar.org wss: ws:",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Webpack configuration for better extension compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Resolve fallbacks for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    return config
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['@stellar/stellar-sdk']
  }
}

module.exports = nextConfig