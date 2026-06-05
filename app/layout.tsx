import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'PT Manager',
  description: 'Plataforma de gestão de consultoria online para personal trainer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
