import './globals.css'
import type { Metadata } from 'next'
import { PrivyWrapper } from './components/privy-provider'

export const metadata: Metadata = {
  title: 'Privy Lit Demo',
  description: 'A simple demo application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
          <PrivyWrapper>
            {children}
          </PrivyWrapper>
      </body>
    </html>
  )
} 