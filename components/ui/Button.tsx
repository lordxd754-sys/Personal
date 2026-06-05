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
    const base = 'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
    const variants = {
      primary: 'bg-primary text-on-primary hover:bg-primary-dim',
      secondary: 'bg-transparent border border-border text-text-primary hover:bg-surface-high',
      danger: 'bg-error text-white hover:bg-red-600',
      ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-high',
    }
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
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
