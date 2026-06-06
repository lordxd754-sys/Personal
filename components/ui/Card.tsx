import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-card border border-surface-border rounded-xl p-6 relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
