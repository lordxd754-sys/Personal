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
          <label
            htmlFor={id}
            className="text-label-caps text-on-surface-variant uppercase tracking-widest"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            className={cn(
              'pt-input rounded-lg text-on-surface font-mono text-data-mono py-2.5 px-3 pr-9 w-full appearance-none transition-all',
              error && 'border-error',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-surface-container">
                {opt.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
            expand_more
          </span>
        </div>
        {error && (
          <span className="text-label-caps text-error">{error}</span>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'
export default Select
