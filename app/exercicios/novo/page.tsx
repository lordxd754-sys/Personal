'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

export default function NovoExercicioPage() {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function updateStep(idx: number, value: string) {
    setSteps(s => s.map((v, i) => i === idx ? value : v))
  }

  function addStep() { setSteps(s => [...s, '']) }
  function removeStep(idx: number) { setSteps(s => s.filter((_, i) => i !== idx)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        steps: steps.filter(s => s.trim()),
        equipment: form.equipment || null,
        description: form.description || null,
        primaryMuscles: form.primaryMuscles || null,
        secondaryMuscles: form.secondaryMuscles || null,
        safetyTip: form.safetyTip || null,
        videoUrl: form.videoUrl || null,
      }
      const res = await fetch('/api/exercises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      router.push(`/exercicios/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">Novo Exercício</h1>
          <p className="text-sm text-text-secondary mt-1">Cadastrar exercício personalizado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <h2 className="text-base font-semibold text-text-primary mb-4">Informações básicas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input id="name" label="Nome do exercício *" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <Select id="muscleGroup" label="Grupo muscular" value={form.muscleGroup} onChange={e => update('muscleGroup', e.target.value)}
                options={['Peito','Costas','Pernas','Ombro','Braços','Abdominais','Glúteos','Cardio'].map(v => ({ value: v, label: v }))} />
              <Select id="equipment" label="Equipamento" value={form.equipment} onChange={e => update('equipment', e.target.value)}
                options={[{ value: '', label: 'Selecione...' }, 'Barra Livre','Halter','Máquina','Cabo','Peso Corporal'].map(v => typeof v === 'string' ? { value: v, label: v } : v)} />
              <Select id="level" label="Nível" value={form.level} onChange={e => update('level', e.target.value)}
                options={['Iniciante','Intermediário','Avançado'].map(v => ({ value: v, label: v }))} />
              <Select id="type" label="Tipo" value={form.type} onChange={e => update('type', e.target.value)}
                options={['Composto','Isolador'].map(v => ({ value: v, label: v }))} />
              <Input id="primaryMuscles" label="Músculos primários" value={form.primaryMuscles} onChange={e => update('primaryMuscles', e.target.value)} placeholder="Peitoral maior, Tríceps" />
              <Input id="secondaryMuscles" label="Músculos secundários" value={form.secondaryMuscles} onChange={e => update('secondaryMuscles', e.target.value)} placeholder="Deltóide anterior" />
              <div className="sm:col-span-2">
                <Input id="videoUrl" label="URL do vídeo" type="url" value={form.videoUrl} onChange={e => update('videoUrl', e.target.value)} placeholder="https://youtube.com/..." />
              </div>
              <div className="sm:col-span-2">
                <Textarea id="description" label="Descrição" value={form.description} onChange={e => update('description', e.target.value)} rows={2} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">Passos de execução</h2>
              <Button type="button" variant="secondary" size="sm" onClick={addStep}>
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar passo
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-2.5">{idx + 1}</span>
                  <Input
                    value={step}
                    onChange={e => updateStep(idx, e.target.value)}
                    placeholder={`Passo ${idx + 1}...`}
                    className="flex-1"
                  />
                  {steps.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(idx)} className="mt-1">
                      <span className="material-symbols-outlined text-sm text-error">remove_circle</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Textarea id="safetyTip" label="Dica de segurança" value={form.safetyTip} onChange={e => update('safetyTip', e.target.value)} rows={2} placeholder="Atenção para..." />
          </Card>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" loading={loading}>
              <span className="material-symbols-outlined text-sm">save</span>
              Salvar exercício
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
