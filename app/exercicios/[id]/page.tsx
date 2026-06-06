'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import type { Exercise } from '@/types'

const muscleGroupColors: Record<string, string> = {
  Peito: 'bg-blue-500/10 text-blue-400',
  Costas: 'bg-green-500/10 text-green-400',
  Pernas: 'bg-orange-500/10 text-orange-400',
  Ombro: 'bg-purple-500/10 text-purple-400',
  Braços: 'bg-yellow-500/10 text-yellow-400',
  Abdominais: 'bg-red-500/10 text-red-400',
  Glúteos: 'bg-pink-500/10 text-pink-400',
  Cardio: 'bg-cyan-500/10 text-cyan-400',
}

export default function ExercicioPage() {
  const params = useParams()
  const router = useRouter()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/exercises/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setExercise(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  async function handleDelete() {
    if (!confirm(`Excluir o exercício "${exercise?.name}"?`)) return
    await fetch(`/api/exercises/${params.id}`, { method: 'DELETE' })
    router.push('/exercicios')
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>
  if (!exercise) return <AppLayout><div className="p-6 text-text-secondary">Exercício não encontrado.</div></AppLayout>

  const colorClass = muscleGroupColors[exercise.muscleGroup] ?? 'bg-surface-high text-text-secondary'

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-text-secondary">
          <Link href="/exercicios" className="hover:text-text-primary transition-colors">Exercícios</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-text-primary">{exercise.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-xl font-semibold text-text-primary flex-1 pr-4">{exercise.name}</h1>
                {exercise.isCustom && (
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/exercicios/${params.id}/editar`}>
                      <Button variant="secondary" size="sm">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={handleDelete}>
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                  {exercise.muscleGroup}
                </span>
                {exercise.equipment && <Badge variant="neutral">{exercise.equipment}</Badge>}
                {exercise.level && <Badge variant="neutral">{exercise.level}</Badge>}
                {exercise.type && <Badge variant="neutral">{exercise.type}</Badge>}
              </div>

              {exercise.description && (
                <p className="text-sm text-text-secondary">{exercise.description}</p>
              )}
            </Card>

            {(exercise.primaryMuscles || exercise.secondaryMuscles) && (
              <Card>
                <h2 className="text-base font-semibold text-text-primary mb-3">Músculos</h2>
                {exercise.primaryMuscles && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Primários</p>
                    <p className="text-sm text-text-primary">{exercise.primaryMuscles}</p>
                  </div>
                )}
                {exercise.secondaryMuscles && (
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Secundários</p>
                    <p className="text-sm text-text-primary">{exercise.secondaryMuscles}</p>
                  </div>
                )}
              </Card>
            )}

            {exercise.safetyTip && (
              <Card className="border-warning/30 bg-warning/5">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-warning shrink-0">warning</span>
                  <div>
                    <p className="text-sm font-medium text-warning mb-1">Dica de segurança</p>
                    <p className="text-sm text-text-primary">{exercise.safetyTip}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Video */}
            {exercise.videoUrl ? (
              <Card className="p-0 overflow-hidden">
                <div className="aspect-video">
                  {exercise.videoUrl.includes('youtube.com') || exercise.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={exercise.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={exercise.videoUrl} controls className="w-full h-full object-cover" />
                  )}
                </div>
              </Card>
            ) : (
              <Card className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-text-secondary block mb-2">play_circle</span>
                  <p className="text-sm text-text-secondary">Sem vídeo demonstrativo</p>
                </div>
              </Card>
            )}

            {/* Steps */}
            {exercise.steps && exercise.steps.length > 0 && (
              <Card>
                <h2 className="text-base font-semibold text-text-primary mb-3">Execução</h2>
                <ol className="space-y-3">
                  {exercise.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-text-primary">{step}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
