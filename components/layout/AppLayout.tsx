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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      <Sidebar
        overdueCount={overdueCount}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 h-14 bg-surface-card/90 backdrop-blur-xl border-b border-surface-border">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              className="w-10 h-10 rounded-lg text-text-muted hover:text-on-surface hover:bg-surface-container flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            {isSubPage && (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Voltar"
                className="w-10 h-10 rounded-lg text-primary hover:bg-primary/10 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <img
              src="/orquestra-mark.png"
              alt="Orquestra"
              className="w-8 h-8 rounded-lg object-cover border border-primary/30"
            />
            <span className="text-label-caps font-bold text-primary">Orquestra</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/perfil')}
            aria-label="Abrir perfil"
            className="w-10 h-10 rounded-lg text-text-muted hover:text-on-surface hover:bg-surface-container flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-xl">person</span>
          </button>
        </header>
        {isSubPage && (
          <button
            type="button"
            onClick={() => router.back()}
            className="hidden md:flex items-center gap-1.5 px-4 pt-4 pb-2 text-text-muted hover:text-on-surface transition-colors group"
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
