import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
  className?: string
}

const variantClasses = {
  default: 'bg-white/[0.04] text-text-muted border border-white/10',
  neutral: 'bg-white/[0.04] text-text-muted border border-white/10',
  primary: 'bg-primary-container/15 text-primary border border-primary-container/30',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-error/10 text-error border border-error/20',
  info: 'bg-secondary/10 text-secondary border border-secondary/20',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
        'font-mono uppercase',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
