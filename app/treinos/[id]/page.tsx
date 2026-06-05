'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import { getInitials, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface WorkoutExercise {
  id?: string
  name: string
  sets: number
  reps: string
  rest: number
  notes: string
  muscleGroup: string
  order: number
}

interface WorkoutSession {
  id?: string
  name: string
  order: number
  warmup: string
  exercises: WorkoutExercise[]
}

interface WorkoutData {
  id: string
  title: string
  status: string
  content: string | null
  createdAt: string
  Student: any
  sessions: WorkoutSession[]
}

export default function TreinoEditorPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workoutId = params.id as string

  const [workout, setWorkout] = useState<WorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copyText, setCopyText] = useState('')
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [exerciseResults, setExerciseResults] = useState<any[]>([])
  const [addingToSession, setAddingToSession] = useState<number | null>(null)
  const [mfitChecked, setMfitChecked] = useState(false)

  // Local editable state
  const [title, setTitle] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [notesExpanded, setNotesExpanded] = useState(true)

  async function loadWorkout() {
    setLoading(true)
    const res = await fetch(`/api/workouts/${workoutId}`)
    const data = await res.json()
    setWorkout(data)
    setTitle(data.title || '')
    const content = data.content ? JSON.parse(data.content) : {}
    setGeneralNotes(content.generalNotes || '')
    setSessions((data.sessions || []).map((s: any) => ({
      ...s,
      warmup: s.warmup || '',
      exercises: (s.WorkoutExercise || s.exercises || []).map((e: any) => ({
        ...e,
        notes: e.notes || '',
        muscleGroup: e.muscleGroup || '',
      })).sort((a: any, b: any) => a.order - b.order),
    })))
    setMfitChecked(data.status === 'enviado_mfit')
    setLoading(false)

    // Auto-generate if ?generate=true
    if (searchParams.get('generate') === 'true') {
      setTimeout(() => generateWithAI(), 500)
    }
  }

  useEffect(() => { loadWorkout() }, [workoutId])

  // Build MFIT export text whenever sessions change
  useEffect(() => {
    if (!title && sessions.length === 0) return
    let text = `${title}\n${'='.repeat(title.length)}\n\n`
    if (generalNotes) text += `Observações:\n${generalNotes}\n\n`
    sessions.forEach(sess => {
      text += `${sess.name.toUpperCase()}\n${'-'.repeat(Math.max(sess.name.length, 10))}\n`
      if (sess.warmup) text += `Aquecimento: ${sess.warmup}\n`
      text += '\n'
      sess.exercises.forEach((ex, idx) => {
        text += `${idx + 1}. ${ex.name} | ${ex.sets}x${ex.reps}${ex.rest ? ` | ${ex.rest}s` : ''}\n`
        if (ex.notes) text += `   → ${ex.notes}\n`
      })
      text += '\n'
    })
    setCopyText(text)
  }, [title, generalNotes, sessions])

  async function generateWithAI() {
    setGenerating(true)
    const res = await fetch(`/api/workouts/${workoutId}/generate`, { method: 'POST' })
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      setGenerating(false)
      return
    }
    await loadWorkout()
    setGenerating(false)
  }

  async function handleSave(newStatus?: string) {
    setSaving(true)
    const sessionsPayload = sessions.map((s, si) => ({
      name: s.name,
      order: si + 1,
      warmup: s.warmup || null,
      exercises: s.exercises.map((e, ei) => ({
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        rest: e.rest,
        notes: e.notes || null,
        muscleGroup: e.muscleGroup || null,
        order: ei + 1,
      })),
    }))

    await fetch(`/api/workouts/${workoutId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content: JSON.stringify({ generalNotes }),
        status: newStatus || workout?.status,
        sessions: sessionsPayload,
      }),
    })
    setSaving(false)
    if (newStatus) await loadWorkout()
  }

  async function handleMfitCheck(checked: boolean) {
    setMfitChecked(checked)
    if (checked) {
      await handleSave('enviado_mfit')
    }
  }

  async function searchExercises(q: string) {
    setExerciseSearch(q)
    if (!q.trim()) { setExerciseResults([]); return }
    const res = await fetch(`/api/exercises?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setExerciseResults(Array.isArray(data) ? data.slice(0, 8) : [])
  }

  function addExerciseToSession(exercise: any) {
    if (addingToSession === null) return
    setSessions(prev => prev.map((s, i) => {
      if (i !== addingToSession) return s
      return {
        ...s,
        exercises: [...s.exercises, {
          name: exercise.name,
          sets: 3,
          reps: '10-12',
          rest: 60,
          notes: '',
          muscleGroup: exercise.muscleGroup || '',
          order: s.exercises.length + 1,
        }],
      }
    }))
    setShowExerciseModal(false)
    setExerciseSearch('')
    setExerciseResults([])
    setAddingToSession(null)
  }

  function removeExercise(sessIdx: number, exIdx: number) {
    setSessions(prev => prev.map((s, si) => {
      if (si !== sessIdx) return s
      return { ...s, exercises: s.exercises.filter((_, ei) => ei !== exIdx) }
    }))
  }

  function moveExercise(sessIdx: number, exIdx: number, dir: -1 | 1) {
    setSessions(prev => prev.map((s, si) => {
      if (si !== sessIdx) return s
      const exs = [...s.exercises]
      const newIdx = exIdx + dir
      if (newIdx < 0 || newIdx >= exs.length) return s
      ;[exs[exIdx], exs[newIdx]] = [exs[newIdx], exs[exIdx]]
      return { ...s, exercises: exs }
    }))
  }

  function updateExercise(sessIdx: number, exIdx: number, field: string, value: string | number) {
    setSessions(prev => prev.map((s, si) => {
      if (si !== sessIdx) return s
      return {
        ...s,
        exercises: s.exercises.map((e, ei) => ei !== exIdx ? e : { ...e, [field]: value }),
      }
    }))
  }

  function updateSession(sessIdx: number, field: string, value: string) {
    setSessions(prev => prev.map((s, si) => si !== sessIdx ? s : { ...s, [field]: value }))
  }

  function addSession() {
    setSessions(prev => [...prev, {
      name: `Treino ${String.fromCharCode(65 + prev.length)}`,
      order: prev.length + 1,
      warmup: '',
      exercises: [],
    }])
  }

  function removeSession(idx: number) {
    if (!confirm('Remover esta sessão?')) return
    setSessions(prev => prev.filter((_, i) => i !== idx))
  }

  if (loading) return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>
  if (!workout) return <AppLayout><div className="p-6 text-text-secondary">Treino não encontrado.</div></AppLayout>

  const student = workout.Student

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.back()} className="text-text-secondary hover:text-text-primary">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="text-xl font-semibold text-text-primary bg-transparent border-none outline-none focus:underline decoration-primary flex-1 min-w-0"
              placeholder="Título do treino"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => handleSave()} loading={saving}>
              <span className="material-symbols-outlined text-sm">save</span>
              Salvar
            </Button>
            {workout.status !== 'aprovado' && workout.status !== 'enviado_mfit' && (
              <Button size="sm" onClick={() => handleSave('aprovado')} loading={saving}>
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Aprovar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-6">
          {/* Left: student info */}
          <div className="space-y-4">
            {student && (
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {getInitials(student.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{student.name}</p>
                    <p className="text-xs text-text-secondary">{student.level}</p>
                  </div>
                </div>
                {student.goal && <p className="text-xs text-text-secondary mb-2">🎯 {student.goal}</p>}
                {student.restrictions && (
                  <div className="bg-warning/10 rounded p-2">
                    <p className="text-xs text-warning font-medium">⚠️ Restrições</p>
                    <p className="text-xs text-text-primary mt-0.5">{student.restrictions}</p>
                  </div>
                )}
                {student.daysPerWeek && <p className="text-xs text-text-secondary mt-2">📅 {student.daysPerWeek}x/semana · {student.sessionDuration}min</p>}
              </Card>
            )}
            <Card className="p-4">
              <p className="text-xs font-medium text-text-secondary uppercase mb-2">Status</p>
              <Badge variant={workout.status === 'aprovado' ? 'success' : workout.status === 'enviado_mfit' ? 'info' : 'neutral'}>
                {workout.status === 'rascunho' ? 'Rascunho' : workout.status === 'aprovado' ? 'Aprovado' : 'No MFIT'}
              </Badge>
              <p className="text-xs text-text-secondary mt-2">{formatDate(workout.createdAt)}</p>
            </Card>
          </div>

          {/* Center: editor */}
          <div className="space-y-4">
            {/* AI notes */}
            {generalNotes && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg">
                <button
                  onClick={() => setNotesExpanded(n => !n)}
                  className="flex items-center justify-between w-full p-4 text-sm font-medium text-primary"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Observações da IA
                  </span>
                  <span className="material-symbols-outlined text-sm">{notesExpanded ? 'expand_less' : 'expand_more'}</span>
                </button>
                {notesExpanded && (
                  <div className="px-4 pb-4">
                    <Textarea
                      value={generalNotes}
                      onChange={e => setGeneralNotes(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sessions */}
            {sessions.map((sess, si) => (
              <Card key={si} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <input
                    value={sess.name}
                    onChange={e => updateSession(si, 'name', e.target.value)}
                    className="text-base font-semibold text-text-primary bg-transparent border-none outline-none focus:underline decoration-primary"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeSession(si)}>
                    <span className="material-symbols-outlined text-sm text-error">delete</span>
                  </Button>
                </div>

                {/* Warmup */}
                <div className="mb-4">
                  <Input
                    label="Aquecimento"
                    value={sess.warmup}
                    onChange={e => updateSession(si, 'warmup', e.target.value)}
                    placeholder="Ex: 5 min esteira + mobilidade"
                    className="text-sm"
                  />
                </div>

                {/* Exercises */}
                <div className="space-y-3">
                  {sess.exercises.map((ex, ei) => (
                    <div key={ei} className="bg-surface-high rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-text-secondary w-5 shrink-0">{ei + 1}</span>
                        <input
                          value={ex.name}
                          onChange={e => updateExercise(si, ei, 'name', e.target.value)}
                          className="flex-1 text-sm font-medium text-text-primary bg-transparent border-none outline-none focus:underline decoration-primary min-w-0"
                        />
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => moveExercise(si, ei, -1)} disabled={ei === 0} className="text-text-secondary hover:text-text-primary disabled:opacity-30">
                            <span className="material-symbols-outlined text-sm">arrow_upward</span>
                          </button>
                          <button onClick={() => moveExercise(si, ei, 1)} disabled={ei === sess.exercises.length - 1} className="text-text-secondary hover:text-text-primary disabled:opacity-30">
                            <span className="material-symbols-outlined text-sm">arrow_downward</span>
                          </button>
                          <button onClick={() => removeExercise(si, ei)} className="text-error hover:text-red-400">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-text-secondary mb-1">Séries</p>
                          <input
                            type="number"
                            value={ex.sets}
                            onChange={e => updateExercise(si, ei, 'sets', Number(e.target.value))}
                            className="w-full bg-surface border border-border rounded px-2 py-1 text-text-primary text-xs outline-none focus:border-primary"
                            min={1}
                          />
                        </div>
                        <div>
                          <p className="text-text-secondary mb-1">Reps</p>
                          <input
                            value={ex.reps}
                            onChange={e => updateExercise(si, ei, 'reps', e.target.value)}
                            className="w-full bg-surface border border-border rounded px-2 py-1 text-text-primary text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <p className="text-text-secondary mb-1">Descanso (s)</p>
                          <input
                            type="number"
                            value={ex.rest}
                            onChange={e => updateExercise(si, ei, 'rest', Number(e.target.value))}
                            className="w-full bg-surface border border-border rounded px-2 py-1 text-text-primary text-xs outline-none focus:border-primary"
                            min={0}
                          />
                        </div>
                      </div>
                      <input
                        value={ex.notes}
                        onChange={e => updateExercise(si, ei, 'notes', e.target.value)}
                        className="mt-2 w-full text-xs text-text-secondary bg-transparent border-none outline-none focus:text-text-primary placeholder:text-text-secondary/50"
                        placeholder="Observações técnicas..."
                      />
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full border border-dashed border-border hover:border-primary"
                  onClick={() => { setAddingToSession(si); setShowExerciseModal(true) }}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar exercício
                </Button>
              </Card>
            ))}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={addSession} className="flex-1">
                <span className="material-symbols-outlined text-sm">add</span>
                Nova sessão
              </Button>
              <Button
                variant="secondary"
                onClick={() => { if (confirm('Isso substituirá o treino atual. Continuar?')) generateWithAI() }}
                loading={generating}
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                {generating ? 'Gerando...' : 'Gerar com IA'}
              </Button>
            </div>
          </div>

          {/* Right: MFIT export */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Export MFIT</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(copyText); alert('Copiado!') }}
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  Copiar
                </Button>
              </div>
              <pre className="text-xs text-text-secondary bg-surface-high rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                {copyText || 'Adicione sessões e exercícios para ver o preview...'}
              </pre>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mfitCheck"
                  checked={mfitChecked}
                  onChange={e => handleMfitCheck(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="mfitCheck" className="text-xs text-text-secondary cursor-pointer">
                  ✅ Já cadastrei no MFIT
                </label>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Exercise search modal */}
      <Modal isOpen={showExerciseModal} onClose={() => { setShowExerciseModal(false); setExerciseSearch(''); setExerciseResults([]) }} title="Adicionar exercício" size="md">
        <div className="space-y-4">
          <Input
            placeholder="Buscar na biblioteca..."
            value={exerciseSearch}
            onChange={e => searchExercises(e.target.value)}
            autoFocus
          />
          {exerciseResults.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {exerciseResults.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToSession(ex)}
                  className="w-full flex items-center justify-between p-3 bg-surface-high rounded-lg hover:bg-primary/10 hover:border-primary transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{ex.name}</p>
                    <p className="text-xs text-text-secondary">{ex.muscleGroup} · {ex.equipment}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-base">add_circle</span>
                </button>
              ))}
            </div>
          ) : exerciseSearch ? (
            <div className="text-center py-8">
              <p className="text-sm text-text-secondary">Nenhum exercício encontrado</p>
              <Link href="/exercicios/novo" className="text-primary text-sm hover:underline mt-1 inline-block">
                Criar exercício personalizado
              </Link>
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">Digite para buscar na biblioteca</p>
          )}
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="secondary" size="sm" onClick={() => { setSessions(p => p.map((s, si) => si !== addingToSession ? s : { ...s, exercises: [...s.exercises, { name: 'Novo exercício', sets: 3, reps: '10-12', rest: 60, notes: '', muscleGroup: '', order: s.exercises.length + 1 }] })); setShowExerciseModal(false) }}>
              Adicionar em branco
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
