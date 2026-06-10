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
          <label
            htmlFor={id}
            className="text-label-caps text-on-surface-variant uppercase tracking-widest"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'pt-input rounded-lg text-on-surface font-mono text-data-mono px-3 py-2.5 w-full placeholder:text-text-muted',
            error && 'border-error',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-label-caps text-error">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
