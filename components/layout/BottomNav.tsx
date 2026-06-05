'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: 'dashboard', label: 'Home', href: '/dashboard' },
  { icon: 'groups', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'monitoring', label: 'Follow-up', href: '/acompanhamento', badge: true },
  { icon: 'person', label: 'Perfil', href: '/perfil' },
]

interface BottomNavProps {
  overdueCount?: number
}

export default function BottomNav({ overdueCount = 0 }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 relative',
                isActive ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && overdueCount > 0 && (
                <span className="absolute top-0 right-1 bg-error text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                  {overdueCount > 9 ? '9+' : overdueCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
