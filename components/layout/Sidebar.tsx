'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'groups', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'menu_book', label: 'Exercícios', href: '/exercicios' },
  { icon: 'monitoring', label: 'Acompanhamento', href: '/acompanhamento', badge: true },
  { icon: 'settings', label: 'Configurações', href: '/configuracoes' },
  { icon: 'person', label: 'Perfil', href: '/perfil' },
]

interface SidebarProps {
  overdueCount?: number
}

export default function Sidebar({ overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-surface-card/80 backdrop-blur-xl border-r border-surface-border z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
            fitness_center
          </span>
        </div>
        <div>
          <h1 className="text-[20px] leading-tight text-primary font-bold">PT Manager</h1>
          <p className="text-label-caps text-text-muted">Elite Performance</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mb-4">
        <Link href="/alunos/novo">
          <button className="w-full bg-primary text-on-primary-container font-semibold text-label-caps py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dim transition-colors active:scale-95 duration-150">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Aluno
          </button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            || (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Footer */}
      <div className="mt-auto border-t border-surface-border pt-3 px-3 pb-4 space-y-0.5">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps text-text-muted hover:bg-surface-container hover:text-on-surface transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">help</span>
          <span>Suporte</span>
        </a>
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps text-text-muted hover:bg-surface-container hover:text-on-surface transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  )
}
