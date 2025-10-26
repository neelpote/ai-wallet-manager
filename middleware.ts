import { NextResponse } from 'next/server'


export function middleware() {
  // Create response
  const response = NextResponse.next()

  // Development CSP that temporarily allows 'unsafe-eval' for wallet extensions
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension: moz-extension:",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://horizon-testnet.stellar.org https://friendbot.stellar.org chrome-extension: moz-extension:",
    "img-src 'self' data: https:",
    "frame-src 'self' chrome-extension: moz-extension:"
  ].join('; ')

  // Set development CSP that allows unsafe-eval
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Content-Security-Policy', csp)
  }

  // Additional security headers (less strict for development)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}