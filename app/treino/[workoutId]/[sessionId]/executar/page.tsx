'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

interface SetEntry { reps: number; weight: number; completed: boolean }

export default function ExecutarPage() {
  const params = useParams()
  const router = useRouter()
  const { workoutId, sessionId } = params as { workoutId: string; sessionId: string }

  const [session, setSession] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [studentId, setStudentId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [currentExIdx, setCurrentExIdx] = useState(0)
  const [sets, setSets] = useState<Record<number, SetEntry[]>>({})
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [workoutTimer, setWorkoutTimer] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const workoutIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const restTimerRef = useRef<number | null>(null)

  useEffect(() => {
    fetch(`/api/workouts/${workoutId}`)
      .then(r => r.ok ? r.json() : null)
      .then(w => {
        if (!w) { setLoading(false); return }
        if (w.studentId) setStudentId(w.studentId)
        const sess = (w.sessions || []).find((s: any) => s.id === sessionId)
        if (sess) {
          const exs = (sess.WorkoutExercise || sess.exercises || []).sort((a: any, b: any) => a.order - b.order)
          setSession(sess)
          setExercises(exs)
          const initialSets: Record<number, SetEntry[]> = {}
          exs.forEach((ex: any, i: number) => {
            initialSets[i] = Array.from({ length: ex.sets }, () => ({ reps: parseInt(ex.reps) || 10, weight: 0, completed: false }))
          })
          setSets(initialSets)
        }
        setLoading(false)
      })
  }, [workoutId, sessionId])

  // Create execution record on mount
  useEffect(() => {
    if (exercises.length === 0) return
    fetch('/api/executions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workoutId,
        sessionId,
        studentId,
        startedAt: new Date().toISOString(),
      }),
    }).then(r => r.ok ? r.json() : null).then(d => { if (d?.id) setExecutionId(d.id) })
  }, [exercises.length, workoutId, sessionId])

  // Workout timer
  useEffect(() => {
    workoutIntervalRef.current = setInterval(() => setWorkoutTimer(t => t + 1), 1000)
    return () => { if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current) }
  }, [])

  // Rest timer
  useEffect(() => {
    if (restTimer === null) {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
        restIntervalRef.current = null
      }
      return
    }
    restTimerRef.current = restTimer
    restIntervalRef.current = setInterval(() => {
      setRestTimer(t => {
        if (t === null || t <= 0) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current)
          return null
        }
        return t - 1
      })
    }, 1000)
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current) }
  }, [restTimer !== null])

  function completeSet(exIdx: number, setIdx: number) {
    setSets(prev => {
      const updated = { ...prev }
      updated[exIdx] = updated[exIdx].map((s, i) => i === setIdx ? { ...s, completed: true } : s)
      return updated
    })
    const restTime = exercises[exIdx]?.rest || 60
    setRestTimer(restTime)
  }

  function formatTimer(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  async function finishWorkout() {
    setSaving(true)
    if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current)

    const setLogs: any[] = []
    exercises.forEach((ex: any, exIdx: number) => {
      ;(sets[exIdx] || []).filter(s => s.completed).forEach((s, setIdx) => {
        setLogs.push({
          exerciseId: ex.exerciseId || ex.id,
          setNumber: setIdx + 1,
          reps: s.reps,
          weight: s.weight,
        })
      })
    })

    if (executionId) {
      await fetch(`/api/executions/${executionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finishedAt: new Date().toISOString(),
          duration: workoutTimer,
          setLogs,
        }),
      })
    }

    setSaving(false)
    router.push(`/treino/${workoutId}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Spinner className="text-4xl" />
    </div>
  )

  if (!session || exercises.length === 0) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-text-secondary">Sessão não encontrada.</p>
    </div>
  )

  const currentEx = exercises[currentExIdx]
  const currentSets = sets[currentExIdx] || []
  const completedSets = currentSets.filter(s => s.completed).length
  const progress = Math.round(((currentExIdx + completedSets / Math.max(currentSets.length, 1)) / exercises.length) * 100)

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
        <button onClick={() => { if (confirm('Sair do treino?')) router.push(`/treino/${workoutId}/${sessionId}`) }} className="text-text-secondary hover:text-text-primary">
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">{session.name}</p>
          <p className="text-xs text-text-secondary">Ex. {currentExIdx + 1}/{exercises.length}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-primary">{formatTimer(workoutTimer)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-surface-high">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Rest timer overlay */}
      {restTimer !== null && (
        <div className="fixed inset-0 bg-background/90 z-50 flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 mb-6">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#27272A" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#10B981" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - restTimer / (currentEx?.rest || 60))}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-4xl font-bold text-primary">{restTimer}</p>
            </div>
          </div>
          <p className="text-text-secondary mb-6">Descansando...</p>
          <Button variant="secondary" onClick={() => setRestTimer(null)}>Pular descanso</Button>
        </div>
      )}

      {/* Exercise */}
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary mb-1">{currentEx.name}</h2>
          <p className="text-sm text-text-secondary">
            {currentEx.sets} séries × {currentEx.reps}
            {currentEx.rest ? ` · ${currentEx.rest}s descanso` : ''}
          </p>
          {currentEx.notes && <p className="text-xs text-text-secondary mt-1 italic">{currentEx.notes}</p>}
        </div>

        {/* Sets table */}
        <div className="space-y-2 mb-6">
          <div className="grid grid-cols-[32px_1fr_1fr_40px] gap-2 text-xs text-text-secondary font-medium px-1 mb-2">
            <span>Série</span>
            <span>Reps</span>
            <span>Carga (kg)</span>
            <span></span>
          </div>
          {currentSets.map((s, si) => (
            <div key={si} className={`grid grid-cols-[32px_1fr_1fr_40px] gap-2 items-center p-2 rounded-lg ${s.completed ? 'bg-primary/10' : 'bg-surface-high'}`}>
              <span className="text-sm font-medium text-center text-text-secondary">{si + 1}</span>
              <input
                type="number"
                value={s.reps}
                onChange={e => setSets(prev => ({ ...prev, [currentExIdx]: prev[currentExIdx].map((x, xi) => xi === si ? { ...x, reps: Number(e.target.value) } : x) }))}
                className="bg-surface border border-border rounded px-2 py-1.5 text-sm text-text-primary text-center outline-none focus:border-primary"
                min={0}
              />
              <input
                type="number"
                value={s.weight}
                onChange={e => setSets(prev => ({ ...prev, [currentExIdx]: prev[currentExIdx].map((x, xi) => xi === si ? { ...x, weight: Number(e.target.value) } : x) }))}
                className="bg-surface border border-border rounded px-2 py-1.5 text-sm text-text-primary text-center outline-none focus:border-primary"
                min={0}
                step={0.5}
              />
              <button
                onClick={() => !s.completed && completeSet(currentExIdx, si)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${s.completed ? 'bg-primary text-on-primary' : 'bg-surface border border-border text-text-secondary hover:border-primary'}`}
              >
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={currentExIdx === 0}
            onClick={() => setCurrentExIdx(i => i - 1)}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Anterior
          </Button>
          {currentExIdx < exercises.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setCurrentExIdx(i => i + 1)}
            >
              Próximo
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Button>
          ) : (
            <Button
              className="flex-1 bg-success hover:bg-green-400"
              onClick={() => setShowComplete(true)}
            >
              Finalizar
              <span className="material-symbols-outlined text-sm">emoji_events</span>
            </Button>
          )}
        </div>
      </div>

      {/* Completion modal */}
      {showComplete && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-sm text-center">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-semibold text-text-primary mb-2">Treino concluído!</h2>
            <p className="text-text-secondary mb-1">Duração: {formatTimer(workoutTimer)}</p>
            <p className="text-text-secondary mb-6">{exercises.length} exercícios</p>
            <Button onClick={finishWorkout} loading={saving} className="w-full">
              <span className="material-symbols-outlined text-sm">save</span>
              Salvar treino
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
