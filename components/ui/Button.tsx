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
    const base = 'inline-flex items-center justify-center gap-2 font-mono font-semibold uppercase tracking-[0.05em] transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
    const variants = {
      primary: 'bg-secondary text-on-secondary hover:bg-secondary-container hover:text-on-secondary-container border border-secondary/30 shadow-[0_0_18px_rgba(233,195,73,0.10)]',
      secondary: 'bg-white/[0.03] border border-white/10 text-on-surface hover:bg-white/[0.06] hover:border-primary-container/40',
      danger: 'bg-error/10 border border-error/30 text-error hover:bg-error/20',
      ghost: 'bg-transparent text-text-muted hover:text-on-surface hover:bg-white/[0.05]',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-label-sm',
      md: 'px-4 py-2 text-label-caps',
      lg: 'px-6 py-3 text-body-sm',
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
