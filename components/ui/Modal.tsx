'use client'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={cn('relative w-full bg-surface border border-border rounded-xl shadow-xl', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="text-title-md text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
