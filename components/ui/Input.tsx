'use client'
import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="font-mono text-label-caps text-text-muted uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 bg-surface-container-lowest border border-surface-border rounded-lg text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(124,58,237,0.18)] transition-all duration-150 text-body-sm',
            error && 'border-error focus:border-error focus:shadow-[0_0_0_2px_rgba(255,180,171,0.12)]',
            className
          )}
          {...props}
        />
        {error && <span className="text-label-sm text-error">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
