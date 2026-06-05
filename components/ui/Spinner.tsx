import { cn } from '@/lib/utils'

export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'material-symbols-outlined animate-spin text-primary',
        className
      )}
    >
      refresh
    </span>
  )
}
