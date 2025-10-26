'use client'

import { useEffect } from 'react'

export default function CSPBypass() {
  useEffect(() => {
    // Aggressive CSP bypass for development
    const bypassCSP = () => {
      try {
        // Remove all existing CSP meta tags
        const cspMetas = document.querySelectorAll('meta[http-equiv*="Content-Security-Policy" i]')
        cspMetas.forEach(meta => {
          console.log('Removing CSP meta:', meta)
          meta.remove()
        })

        // Override CSP via meta tag
        const newMeta = document.createElement('meta')
        newMeta.httpEquiv = 'Content-Security-Policy'
        newMeta.content = "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src *; style-src * 'unsafe-inline';"
        document.head.insertBefore(newMeta, document.head.firstChild)

        // Test if eval works now
        try {
          eval('console.log("✅ CSP bypass successful - eval() works!")')
        } catch (e) {
          console.error('❌ CSP still blocking eval:', e)
        }

        console.log('🔓 CSP bypass applied')
      } catch (error) {
        console.error('CSP bypass failed:', error)
      }
    }

    // Run immediately
    bypassCSP()

    // Also run after a short delay in case DOM changes
    setTimeout(bypassCSP, 100)
    setTimeout(bypassCSP, 500)
    setTimeout(bypassCSP, 1000)

  }, [])

  return null // This component doesn't render anything
}