import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { getSession } from '@/lib/get-session'

export const metadata: Metadata = {
  title: 'PT Manager',
  description: 'Plataforma de gestão de consultoria online para personal trainer',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  return (
    <html lang="pt-BR">
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
