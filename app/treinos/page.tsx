'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import { formatDate, getInitials } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'enviado_mfit', label: 'No MFIT' },
]

const workoutStatusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  rascunho: { label: 'Rascunho', variant: 'neutral' },
  aprovado: { label: 'Aprovado', variant: 'success' },
  enviado_mfit: { label: 'No MFIT', variant: 'info' },
}

export default function TreinosPage() {
  const [workouts, setWorkouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    fetch(`/api/workouts?${params}`)
      .then(r => r.json())
      .then(d => { setWorkouts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [statusFilter])

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">Treinos</h1>
            <p className="text-sm text-text-secondary mt-1">{workouts.length} treino{workouts.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/alunos">
            <Button>
              <span className="material-symbols-outlined text-sm">add</span>
              Criar via aluno
            </Button>
          </Link>
        </div>

        <div className="flex gap-3 mb-6">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} className="w-48" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="text-4xl" /></div>
        ) : workouts.length === 0 ? (
          <Card className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-text-secondary block mb-2">fitness_center</span>
            <p className="text-lg font-medium text-text-primary mb-2">Nenhum treino encontrado</p>
            <p className="text-sm text-text-secondary mb-6">Crie treinos pela página de alunos</p>
            <Link href="/alunos"><Button>Ver alunos</Button></Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workouts.map((w: any) => {
              const st = workoutStatusMap[w.status as string] ?? { label: w.status, variant: 'neutral' as const }
              const sessions = w.sessions || w.WorkoutSession || []
              const previewExercises: string[] = []
              sessions.slice(0, 2).forEach((s: any) => {
                const exs = s.WorkoutExercise || s.exercises || []
                exs.slice(0, 2).forEach((e: any) => previewExercises.push(e.name))
              })

              return (
                <Link key={w.id} href={`/treinos/${w.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer p-4 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-sm font-medium text-text-primary flex-1 pr-2">{w.title}</h3>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>

                    {w.Student && (
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                          {getInitials(w.Student.name)}
                        </div>
                        <p className="text-xs text-text-secondary">{w.Student.name}</p>
                      </div>
                    )}

                    {previewExercises.length > 0 && (
                      <div className="flex-1 mb-3">
                        {previewExercises.map((name, i) => (
                          <p key={i} className="text-xs text-text-secondary truncate">· {name}</p>
                        ))}
                        {sessions.length > 0 && (
                          <p className="text-xs text-primary mt-1">{sessions.length} sessão{sessions.length > 1 ? 'ões' : ''}</p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-text-secondary mt-auto">{formatDate(w.createdAt)}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
