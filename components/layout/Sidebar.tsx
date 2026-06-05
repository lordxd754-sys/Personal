'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

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
    <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <span className="material-symbols-outlined text-primary text-2xl">fitness_center</span>
        <span className="text-title-md text-text-primary">PT Manager</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-colors relative',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-high hover:text-text-primary'
              )}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-label-md">{item.label}</span>
              {item.badge && overdueCount > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-error text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md w-full text-text-secondary hover:bg-surface-high hover:text-text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-label-md">Sair</span>
        </button>
      </div>
    </aside>
  )
}
