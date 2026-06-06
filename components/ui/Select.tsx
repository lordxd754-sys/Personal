'use client'
import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-label-caps text-text-muted">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 bg-surface-container-lowest border border-surface-border rounded-lg text-on-surface focus:outline-none focus:border-primary focus:shadow-[0_0_0_2px_rgba(173,199,255,0.1)] transition-all duration-150 text-body-sm appearance-none',
            error && 'border-error',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-card">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-label-sm text-error">{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
export default Select
