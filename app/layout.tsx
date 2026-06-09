import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { auth } from '@/lib/auth'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PT Manager',
  description: 'Plataforma de gestão de consultoria online para personal trainer',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <html lang="pt-BR" className={`dark ${inter.variable}`}>
      <body>
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
