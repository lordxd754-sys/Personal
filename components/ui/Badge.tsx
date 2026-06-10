import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
  className?: string
}

const variantClasses = {
  default: 'bg-charcoal-surface text-text-muted border border-glass-stroke',
  neutral: 'bg-charcoal-surface text-text-muted border border-glass-stroke',
  primary: 'bg-performance-cyan/10 text-performance-cyan border border-performance-cyan/30',
  success: 'bg-success-emerald/10 text-success-emerald border border-success-emerald/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  error: 'bg-attention-coral/10 text-attention-coral border border-attention-coral/20',
  info: 'bg-secondary/10 text-secondary border border-secondary/20',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
