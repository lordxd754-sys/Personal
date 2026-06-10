'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'group', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'menu_book', label: 'Exercícios', href: '/exercicios' },
  { icon: 'calendar_today', label: 'Agenda', href: '/agenda' },
  { icon: 'analytics', label: 'Acompanhamento', href: '/acompanhamento', badge: true },
  { icon: 'settings', label: 'Configurações', href: '/configuracoes' },
  { icon: 'person', label: 'Perfil', href: '/perfil' },
]

interface SidebarProps {
  overdueCount?: number
}

export default function Sidebar({ overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-[280px] h-screen sticky top-0 bg-obsidian-dark border-r border-glass-stroke z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="w-10 h-10 rounded-full bg-performance-cyan/10 flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-performance-cyan"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            fitness_center
          </span>
        </div>
        <div>
          <h1 className="text-headline-sm text-performance-cyan leading-tight">PT Manager</h1>
          <p className="text-label-caps text-on-surface-variant uppercase tracking-widest">Elite Performance</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 mb-4">
        <Link href="/alunos/novo">
          <button className="w-full bg-performance-cyan text-on-primary-fixed font-semibold text-label-caps py-2 rounded-full flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 hover:shadow-[0_0_15px_rgba(0,229,255,0.3)]">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Aluno
          </button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href + '/')) ||
            (item.href === '/dashboard' && pathname === '/dashboard')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps font-medium transition-all duration-150 active:scale-95 relative overflow-hidden',
                isActive
                  ? 'bg-charcoal-surface text-performance-cyan font-bold'
                  : 'text-on-surface-variant hover:bg-charcoal-surface hover:text-on-surface'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4/5 bg-performance-cyan rounded-r-full" />
              )}
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && overdueCount > 0 && (
                <span className="ml-auto bg-alert-red text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-glass-stroke pt-3 px-3 pb-4 space-y-0.5">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-label-caps text-attention-coral hover:bg-attention-coral/10 transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  )
}
