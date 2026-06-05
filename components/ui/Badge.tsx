import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  className?: string
}

const variantClasses = {
  default: 'bg-surface-high text-text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-blue-500/10 text-blue-400',
  neutral: 'bg-surface-high text-text-secondary',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
