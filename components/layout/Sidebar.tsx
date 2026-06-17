'use client'
import Link from 'next/link'
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
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
            fitness_center
          </span>
        </div>
        <div>
          <h1 className="text-[20px] leading-tight text-primary font-bold">PT Manager</h1>
          <p className="text-label-caps text-text-muted">Performance Premium</p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <Link
          href="/alunos/novo"
          onClick={closeOnNavigate ? onMobileClose : undefined}
          className="w-full bg-primary text-on-primary-container font-semibold text-label-caps py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors active:scale-95 duration-150"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Aluno
        </Link>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            || (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeOnNavigate ? onMobileClose : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps font-medium transition-all duration-150 active:scale-95 relative',
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-text-muted hover:bg-surface-container hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-xl" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && overdueCount > 0 && (
                <span className="ml-auto bg-error text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-surface-border pt-3 px-3 pb-4 space-y-0.5">
        <Link
          href="/configuracoes"
          onClick={closeOnNavigate ? onMobileClose : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps text-text-muted hover:bg-surface-container hover:text-on-surface transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          <span>Suporte</span>
        </Link>
        <Link
          href="/login"
          onClick={closeOnNavigate ? onMobileClose : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps text-text-muted hover:bg-surface-container hover:text-on-surface transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair</span>
        </Link>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-surface-card/80 backdrop-blur-xl border-r border-surface-border z-50">
        {content()}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="relative flex flex-col w-[min(18rem,82vw)] h-full bg-surface-card border-r border-surface-border shadow-2xl">
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
