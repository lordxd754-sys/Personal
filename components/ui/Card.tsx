import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
