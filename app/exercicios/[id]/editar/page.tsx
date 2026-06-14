'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import type { Exercise } from '@/types'

const muscleGroups = ['Peito', 'Costas', 'Pernas', 'Ombro', 'Braços', 'Abdominais', 'Glúteos', 'Cardio']
const equipmentOptions = ['', 'Barra Livre', 'Halter', 'Máquina', 'Cabo', 'Peso Corporal']
const levelOptions = ['Iniciante', 'Intermediário', 'Avançado']
const typeOptions = ['Composto', 'Isolador']

export default function EditarExercicioPage() {
  const params = useParams()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    muscleGroup: 'Peito',
    equipment: '',
    level: 'Iniciante',
    type: 'Composto',
    description: '',
    primaryMuscles: '',
    secondaryMuscles: '',
    safetyTip: '',
    videoUrl: '',
  })
  const [steps, setSteps] = useState<string[]>([''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/exercises/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then((exercise: Exercise | null) => {
        if (!exercise) {
          setError('Exercício não encontrado')
          return
        }
        setForm({
          name: exercise.name || '',
          muscleGroup: exercise.muscleGroup || 'Peito',
          equipment: exercise.equipment || '',
          level: exercise.level || 'Iniciante',
          type: exercise.type || 'Composto',
          description: exercise.description || '',
          primaryMuscles: exercise.primaryMuscles || '',
          secondaryMuscles: exercise.secondaryMuscles || '',
          safetyTip: exercise.safetyTip || '',
          videoUrl: exercise.videoUrl || '',
        })
        setSteps(exercise.steps?.length ? exercise.steps : [''])
      })
      .catch(() => setError('Não foi possível carregar o exercício'))
      .finally(() => setLoading(false))
  }, [params.id])

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function updateStep(idx: number, value: string) {
    setSteps(s => s.map((step, i) => i === idx ? value : step))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        steps: steps.filter(step => step.trim()),
        equipment: form.equipment || null,
        description: form.description || null,
        primaryMuscles: form.primaryMuscles || null,
        secondaryMuscles: form.secondaryMuscles || null,
        safetyTip: form.safetyTip || null,
        videoUrl: form.videoUrl || null,
      }
      const res = await fetch(`/api/exercises/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      router.push(`/exercicios/${params.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  if (loading) {
    return <AppLayout><div className="flex justify-center py-20"><Spinner className="text-4xl" /></div></AppLayout>
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-headline-lg-mobile md:text-headline-md text-text-primary">Editar Exercício</h1>
          <p className="text-body-sm text-text-secondary mt-1">Atualize os dados do exercício personalizado.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <h2 className="text-title-md text-text-primary mb-4">Informações básicas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input id="name" label="Nome do exercício *" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <Select id="muscleGroup" label="Grupo muscular" value={form.muscleGroup} onChange={e => update('muscleGroup', e.target.value)} options={muscleGroups.map(v => ({ value: v, label: v }))} />
              <Select id="equipment" label="Equipamento" value={form.equipment} onChange={e => update('equipment', e.target.value)} options={equipmentOptions.map(v => ({ value: v, label: v || 'Selecione...' }))} />
              <Select id="level" label="Nível" value={form.level} onChange={e => update('level', e.target.value)} options={levelOptions.map(v => ({ value: v, label: v }))} />
              <Select id="type" label="Tipo" value={form.type} onChange={e => update('type', e.target.value)} options={typeOptions.map(v => ({ value: v, label: v }))} />
              <Input id="primaryMuscles" label="Músculos primários" value={form.primaryMuscles} onChange={e => update('primaryMuscles', e.target.value)} />
              <Input id="secondaryMuscles" label="Músculos secundários" value={form.secondaryMuscles} onChange={e => update('secondaryMuscles', e.target.value)} />
              <div className="sm:col-span-2">
                <Input id="videoUrl" label="URL do vídeo" type="url" value={form.videoUrl} onChange={e => update('videoUrl', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Textarea id="description" label="Descrição" value={form.description} onChange={e => update('description', e.target.value)} rows={2} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-title-md text-text-primary">Passos de execução</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => setSteps(s => [...s, ''])}>
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-2.5">{idx + 1}</span>
                  <Input value={step} onChange={e => updateStep(idx, e.target.value)} placeholder={`Passo ${idx + 1}...`} className="flex-1" />
                  {steps.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSteps(s => s.filter((_, i) => i !== idx))} className="mt-1">
                      <span className="material-symbols-outlined text-sm text-error">remove_circle</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Textarea id="safetyTip" label="Dica de segurança" value={form.safetyTip} onChange={e => update('safetyTip', e.target.value)} rows={2} />
          </Card>

          {error && <p className="text-error text-body-sm">{error}</p>}

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={saving}>
              <span className="material-symbols-outlined text-sm">save</span>
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
