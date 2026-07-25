import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-card backdrop-blur-xl border border-white/10 rounded-lg p-6 relative overflow-hidden transition-colors duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
