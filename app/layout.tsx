import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { getSession } from '@/lib/get-session'

export const metadata: Metadata = {
  title: 'Orquestra',
  description: 'Plataforma de gestão de alunos, treinos e avaliações físicas',
  icons: {
    icon: '/orquestra-icon.png',
    apple: '/orquestra-apple-icon.png',
  },
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
