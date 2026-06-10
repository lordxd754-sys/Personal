'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'group', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'calendar_today', label: 'Agenda', href: '/agenda' },
  { icon: 'analytics', label: 'Stats', href: '/acompanhamento' },
]

interface BottomNavProps {
  overdueCount?: number
}

export default function BottomNav({ overdueCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1 glass-panel rounded-full px-2 py-2 z-50">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-150 active:scale-90 relative',
              isActive
                ? 'bg-performance-cyan/10 text-performance-cyan'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {item.icon}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
