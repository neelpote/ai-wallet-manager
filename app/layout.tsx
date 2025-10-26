import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/kiro-theme.css'
import { AppProvider } from '../contexts/AppContext'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Wallet Manager',
  description: 'Stellar wallet with AI-powered natural language commands',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="kiro-dark">
      <head>
        <script src="/csp-override.js" />
      </head>
      <body className={`${inter.className} kiro-scrollbar`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}