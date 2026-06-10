'use client'
import { cn } from '@/lib/utils'
import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'pt-input rounded-lg text-on-surface text-body-md p-3 w-full resize-none transition-all placeholder:text-text-muted',
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
Textarea.displayName = 'Textarea'
export default Textarea
