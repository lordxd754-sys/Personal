import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bento-card rounded-xl p-md relative overflow-hidden',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
