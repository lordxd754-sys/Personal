'use client'
import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

    const variants = {
      primary:
        'bg-performance-cyan text-on-primary-fixed text-label-caps hover:shadow-[0_12px_32px_rgba(0,229,255,0.25)]',
      secondary:
        'bg-transparent border border-glass-stroke text-on-surface text-label-caps hover:bg-charcoal-surface',
      danger:
        'bg-attention-coral/10 border border-attention-coral/30 text-attention-coral hover:bg-attention-coral/20',
      ghost:
        'text-on-surface-variant hover:text-on-surface hover:bg-charcoal-surface',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-label-caps',
      md: 'px-4 py-2 text-label-caps',
      lg: 'px-6 py-3 text-body-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="material-symbols-outlined animate-spin text-base">refresh</span>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
