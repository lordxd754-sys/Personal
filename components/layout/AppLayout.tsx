'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const ROOT_PATHS = [
  '/dashboard', '/alunos', '/treinos', '/exercicios',
  '/agenda', '/acompanhamento', '/configuracoes', '/perfil',
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [overdueCount, setOverdueCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const isSubPage = !ROOT_PATHS.includes(pathname)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.metrics?.overdueFollowUp !== undefined) {
          setOverdueCount(d.metrics.overdueFollowUp)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar overdueCount={overdueCount} />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        {isSubPage && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 px-4 pt-4 pb-2 text-text-muted hover:text-on-surface transition-colors group"
          >
            <span className="material-symbols-outlined text-xl group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span className="text-label-caps font-semibold">Voltar</span>
          </button>
        )}
        {children}
      </main>
      <BottomNav overdueCount={overdueCount} />
    </div>
  )
}
