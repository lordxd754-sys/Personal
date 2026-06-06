'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'

export default function WorkoutViewPage() {
  const params = useParams()
  const workoutId = params.workoutId as string
  const [workout, setWorkout] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/workouts/${workoutId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setWorkout(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [workoutId])

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>
  if (!workout) return <AppLayout><div className="p-6 text-text-secondary">Treino não encontrado.</div></AppLayout>

  const sessions = workout.sessions || []

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">{workout.title}</h1>
          {workout.Student && <p className="text-sm text-text-secondary mt-1">{workout.Student.name}</p>}
        </div>

        <div className="space-y-4">
          {sessions.map((sess: any) => {
            const exercises = (sess.WorkoutExercise || sess.exercises || []).sort((a: any, b: any) => a.order - b.order)
            return (
              <Card key={sess.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-text-primary">{sess.name}</h2>
                  <Link href={`/treino/${workoutId}/${sess.id}`}>
                    <Button size="sm">
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      Iniciar
                    </Button>
                  </Link>
                </div>
                {sess.warmup && <p className="text-xs text-text-secondary mb-3">🔥 {sess.warmup}</p>}
                <div className="space-y-1">
                  {exercises.slice(0, 5).map((ex: any, i: number) => (
                    <p key={i} className="text-sm text-text-primary">
                      {i + 1}. {ex.name} — <span className="text-text-secondary">{ex.sets}×{ex.reps}</span>
                    </p>
                  ))}
                  {exercises.length > 5 && <p className="text-xs text-text-secondary">+{exercises.length - 5} exercícios</p>}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
