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
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-label-md text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 bg-[#141414] border border-border rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary transition-colors text-body-sm',
            error && 'border-error',
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
