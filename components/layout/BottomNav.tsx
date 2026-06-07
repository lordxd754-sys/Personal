'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'groups', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'menu_book', label: 'Exercícios', href: '/exercicios' },
  { icon: 'person', label: 'Perfil', href: '/perfil' },
]

interface BottomNavProps {
  overdueCount?: number
}

export default function BottomNav({ overdueCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card/90 backdrop-blur-xl border-t border-surface-border z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-150 active:scale-95 relative',
                isActive ? 'text-primary' : 'text-text-muted'
              )}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className={cn('text-[10px] font-semibold', isActive ? 'text-primary' : 'text-text-muted')}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
