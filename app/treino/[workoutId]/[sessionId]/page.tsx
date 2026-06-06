'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'

export default function SessionViewPage() {
  const params = useParams()
  const { workoutId, sessionId } = params as { workoutId: string; sessionId: string }
  const [workout, setWorkout] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [lastExecution, setLastExecution] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/workouts/${workoutId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/sessions/${sessionId}/last-execution`).then(r => r.ok ? r.json() : null),
    ]).then(([w, le]) => {
      setWorkout(w)
      const sess = (w?.sessions || []).find((s: any) => s.id === sessionId)
      setSession(sess || null)
      setLastExecution(le || {})
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [workoutId, sessionId])

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>
  if (!session) return <AppLayout><div className="p-6 text-text-secondary">Sessão não encontrada.</div></AppLayout>

  const exercises = (session.WorkoutExercise || session.exercises || []).sort((a: any, b: any) => a.order - b.order)

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-sm text-text-secondary mb-1">{workout?.title}</p>
          <h1 className="text-2xl font-semibold text-text-primary">{session.name}</h1>
          {session.warmup && (
            <div className="mt-3 bg-warning/10 border border-warning/20 rounded-lg p-3">
              <p className="text-sm text-warning font-medium">🔥 Aquecimento</p>
              <p className="text-sm text-text-primary mt-1">{session.warmup}</p>
            </div>
          )}
        </div>

        <Link href={`/treino/${workoutId}/${sessionId}/executar`}>
          <Button className="w-full mb-6" size="lg">
            <span className="material-symbols-outlined">play_arrow</span>
            Iniciar Treino
          </Button>
        </Link>

        <div className="space-y-3">
          {exercises.map((ex: any, idx: number) => {
            const last = lastExecution[ex.id] || lastExecution[ex.exerciseId]
            return (
              <Card key={ex.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {ex.sets} séries × {ex.reps} reps
                      {ex.rest ? ` · ${ex.rest}s descanso` : ''}
                    </p>
                    {ex.notes && <p className="text-xs text-text-secondary mt-1 italic">{ex.notes}</p>}
                  </div>
                  {last && (
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-text-secondary">Últ. execução</p>
                      <p className="text-xs text-primary font-medium">{last.weight}kg × {last.reps}</p>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
