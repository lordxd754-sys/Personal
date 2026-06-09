'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function AgendaPage() {
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === '1') {
      setToast({ type: 'success', message: 'Google Calendar conectado com sucesso!' })
    } else if (error === 'google_denied') {
      setToast({ type: 'error', message: 'Permissão negada pelo Google.' })
    } else if (error) {
      setToast({ type: 'error', message: 'Erro ao conectar Google Calendar. Tente novamente.' })
    }

    if (connected || error) {
      const url = new URL(window.location.href)
      url.searchParams.delete('connected')
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-headline-sm text-text-primary">Agenda</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Gerencie seus compromissos e sessões com alunos.
        </p>
      </div>

      {toast && (
        <div
          className={`mb-6 p-4 rounded-xl text-body-sm flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-success/10 border border-success/30 text-success'
              : 'bg-error/10 border border-error/30 text-error'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl">calendar_today</span>
          </div>
          <div className="flex-1">
            <h2 className="text-title-sm text-text-primary mb-1">Google Calendar</h2>
            <p className="text-body-sm text-text-secondary mb-4">
              Conecte sua conta Google para sincronizar sessões e compromissos diretamente no seu calendário.
            </p>
            <Button
              variant="secondary"
              onClick={() => { window.location.href = '/api/auth/google-connect' }}
            >
              <span className="material-symbols-outlined text-sm">link</span>
              Conectar com Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
