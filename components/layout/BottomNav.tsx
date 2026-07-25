'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navItems } from '@/components/navigation/navItems'

const mainItems = navItems.filter(item => ['/dashboard', '/alunos', '/treinos', '/agenda'].includes(item.href))
const moreItems = navItems.filter(item => !mainItems.some(main => main.href === item.href))

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
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More panel */}
      <div className={cn(
        'md:hidden fixed left-0 right-0 z-50 bg-surface-card/95 backdrop-blur-2xl border-t border-white/10 transition-transform duration-300 ease-out shadow-[0_-20px_40px_rgba(0,0,0,0.45)]',
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
                  'flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all active:scale-95 relative',
                  isActive ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'text-text-muted hover:bg-white/[0.05]'
                )}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-mono text-[10px] font-semibold text-center leading-tight uppercase">{item.label}</span>
                {item.badge && overdueCount > 0 && (
                  <span className="absolute top-2 right-2 bg-error text-on-error text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                    {overdueCount > 9 ? '9+' : overdueCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card/90 backdrop-blur-2xl border-t border-white/10 z-50 h-[60px] shadow-[0_-12px_30px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-around h-full px-1">
          {mainItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 relative',
                  isActive ? 'text-secondary' : 'text-text-muted'
                )}
              >
                <span
                  className="material-symbols-outlined text-2xl"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className={cn('font-mono text-[10px] font-semibold uppercase', isActive ? 'text-secondary' : 'text-text-muted')}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-secondary rounded-full" />
                )}
              </Link>
            )
          })}

          {/* Mais button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-95 relative',
              showMore || isMoreActive ? 'text-secondary' : 'text-text-muted'
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
            <span className={cn('font-mono text-[10px] font-semibold uppercase', showMore || isMoreActive ? 'text-secondary' : 'text-text-muted')}>
              Mais
            </span>
            {!showMore && isMoreActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-secondary rounded-full" />
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
