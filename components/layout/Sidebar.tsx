'use client'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navItems } from '@/components/navigation/navItems'

interface SidebarProps {
  overdueCount?: number
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ overdueCount = 0, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const content = (closeOnNavigate = false) => (
    <>
      <div className="px-6 pt-7 pb-5">
        <div className="flex items-center gap-3">
        <img
          src="/orquestra-mark.png"
          alt="Orquestra"
          className="w-12 h-12 rounded-lg object-cover border border-secondary/40 shrink-0"
        />
        <div>
          <h1 className="text-[22px] leading-tight text-primary-container font-bold uppercase">Orquestra</h1>
          <p className="font-mono text-label-caps text-text-muted uppercase">Performance Premium</p>
        </div>
        </div>
      </div>

      <div className="px-4 mb-5">
        <Link
          href="/alunos/novo"
          onClick={closeOnNavigate ? onMobileClose : undefined}
          className="w-full bg-secondary text-on-secondary font-mono font-semibold text-label-caps py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-secondary-container hover:text-on-secondary-container transition-all active:scale-95 duration-200 shadow-[0_0_18px_rgba(233,195,73,0.10)]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Aluno
        </Link>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            || (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeOnNavigate ? onMobileClose : undefined}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-lg font-mono text-label-caps font-medium transition-all duration-200 active:scale-95 relative',
                isActive
                  ? 'bg-secondary/10 text-secondary border-r-2 border-secondary font-bold'
                  : 'text-text-muted hover:bg-white/[0.05] hover:text-on-surface hover:translate-x-1'
              )}
            >
              <span className="material-symbols-outlined text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && overdueCount > 0 && (
                <span className="ml-auto bg-error text-on-error text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-white/5 pt-4 px-4 pb-5 space-y-1.5">
        <Link
          href="/configuracoes"
          onClick={closeOnNavigate ? onMobileClose : undefined}
          className="flex items-center gap-4 px-4 py-2 rounded-lg font-mono text-label-caps text-text-muted hover:bg-white/[0.05] hover:text-on-surface transition-all duration-200"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          <span>Suporte</span>
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-4 px-4 py-2 rounded-lg font-mono text-label-caps text-text-muted hover:bg-white/[0.05] hover:text-on-surface transition-all duration-200"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-surface-card/70 backdrop-blur-2xl border-r border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.35)] z-50">
        {content()}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onMobileClose}
          />
          <aside className="relative flex flex-col w-[min(18rem,82vw)] h-full bg-surface-card/95 backdrop-blur-2xl border-r border-white/10 shadow-2xl">
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={onMobileClose}
              className="absolute right-3 top-3 w-9 h-9 rounded-lg text-text-muted hover:text-on-surface hover:bg-surface-container flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            {content(true)}
          </aside>
        </div>
      )}
    </>
  )
}
