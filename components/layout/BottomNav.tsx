'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mainItems = [
  { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { icon: 'groups', label: 'Alunos', href: '/alunos' },
  { icon: 'fitness_center', label: 'Treinos', href: '/treinos' },
  { icon: 'calendar_month', label: 'Agenda', href: '/agenda' },
]

const moreItems = [
  { icon: 'menu_book', label: 'Exercícios', href: '/exercicios' },
  { icon: 'monitoring', label: 'Acompanhamento', href: '/acompanhamento', badge: true },
  { icon: 'settings', label: 'Configurações', href: '/configuracoes' },
  { icon: 'person', label: 'Perfil', href: '/perfil' },
]

interface BottomNavProps {
  overdueCount?: number
}

export default function BottomNav({ overdueCount = 0 }: BottomNavProps) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = moreItems.some(
    item => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <>
      {/* More panel overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More panel */}
      <div className={cn(
        'md:hidden fixed left-0 right-0 z-50 bg-surface-card border-t border-surface-border transition-transform duration-300 ease-out',
        showMore ? 'translate-y-0' : 'translate-y-full',
        'bottom-[60px]'
      )}>
        <div className="p-4 grid grid-cols-4 gap-2">
          {moreItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all active:scale-95 relative',
                  isActive ? 'bg-primary-container/20 text-primary' : 'text-text-muted hover:bg-surface-container'
                )}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
                {item.badge && overdueCount > 0 && (
                  <span className="absolute top-2 right-2 bg-error text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                    {overdueCount > 9 ? '9+' : overdueCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card/90 backdrop-blur-xl border-t border-surface-border z-50 h-[60px]">
        <div className="flex items-center justify-around h-full px-1">
          {mainItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 relative',
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

          {/* Mais button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150 active:scale-95 relative',
              showMore || isMoreActive ? 'text-primary' : 'text-text-muted'
            )}
          >
            <span
              className="material-symbols-outlined text-2xl transition-transform duration-200"
              style={{
                transform: showMore ? 'rotate(45deg)' : 'rotate(0deg)',
                ...(showMore || isMoreActive ? { fontVariationSettings: "'FILL' 1" } : {}),
              }}
            >
              {showMore ? 'close' : 'grid_view'}
            </span>
            <span className={cn('text-[10px] font-semibold', showMore || isMoreActive ? 'text-primary' : 'text-text-muted')}>
              Mais
            </span>
            {!showMore && isMoreActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
            )}
            {overdueCount > 0 && !showMore && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
