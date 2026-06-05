'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import type { Student } from '@/types'

interface StudentFormProps {
  initial?: Partial<Student>
  studentId?: string
}

export default function StudentForm({ initial, studentId }: StudentFormProps) {
  const router = useRouter()
  const isEdit = !!studentId

  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    birthdate: initial?.birthdate ? initial.birthdate.split('T')[0] : '',
    city: initial?.city || '',
    state: initial?.state || '',
    goal: initial?.goal || '',
    level: initial?.level || 'iniciante',
    daysPerWeek: String(initial?.daysPerWeek ?? 3),
    sessionDuration: String(initial?.sessionDuration ?? 60),
    restrictions: initial?.restrictions || '',
    equipment: initial?.equipment || '',
    notes: initial?.notes || '',
    mfitId: initial?.mfitId || '',
    status: initial?.status || 'ativo',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      daysPerWeek: Number(form.daysPerWeek),
      sessionDuration: Number(form.sessionDuration),
      birthdate: form.birthdate || null,
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      state: form.state || null,
      goal: form.goal || null,
      restrictions: form.restrictions || null,
      equipment: form.equipment || null,
      notes: form.notes || null,
      mfitId: form.mfitId || null,
    }

    try {
      const url = isEdit ? `/api/students/${studentId}` : '/api/students'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      router.push(`/alunos/${data.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <Card className="mb-4">
        <h2 className="text-title-md text-text-primary mb-4">Dados pessoais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input id="name" label="Nome completo *" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <Input id="email" label="E-mail" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
          <Input id="phone" label="Telefone" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(11) 99999-9999" />
          <Input id="birthdate" label="Data de nascimento" type="date" value={form.birthdate} onChange={e => update('birthdate', e.target.value)} />
          <Select
            id="status"
            label="Status"
            value={form.status}
            onChange={e => update('status', e.target.value)}
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'pausado', label: 'Pausado' },
              { value: 'inativo', label: 'Inativo' },
            ]}
          />
          <Input id="city" label="Cidade" value={form.city} onChange={e => update('city', e.target.value)} />
          <Input id="state" label="Estado" value={form.state} onChange={e => update('state', e.target.value)} placeholder="SP" maxLength={2} />
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-title-md text-text-primary mb-4">Objetivos e treino</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input id="goal" label="Objetivo principal" value={form.goal} onChange={e => update('goal', e.target.value)} placeholder="Ex: Hipertrofia, Emagrecimento..." />
          </div>
          <Select
            id="level"
            label="Nível"
            value={form.level}
            onChange={e => update('level', e.target.value)}
            options={[
              { value: 'iniciante', label: 'Iniciante' },
              { value: 'intermediario', label: 'Intermediário' },
              { value: 'avancado', label: 'Avançado' },
            ]}
          />
          <Select
            id="daysPerWeek"
            label="Dias por semana"
            value={form.daysPerWeek}
            onChange={e => update('daysPerWeek', e.target.value)}
            options={[1, 2, 3, 4, 5, 6, 7].map(n => ({ value: String(n), label: `${n} dia${n > 1 ? 's' : ''}` }))}
          />
          <Select
            id="sessionDuration"
            label="Duração da sessão (min)"
            value={form.sessionDuration}
            onChange={e => update('sessionDuration', e.target.value)}
            options={[30, 45, 60, 75, 90, 120].map(n => ({ value: String(n), label: `${n} minutos` }))}
          />
          <Input id="mfitId" label="ID MFIT" value={form.mfitId} onChange={e => update('mfitId', e.target.value)} placeholder="ID no app MFIT" />
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-title-md text-text-primary mb-4">Informações adicionais</h2>
        <div className="flex flex-col gap-4">
          <Textarea
            id="restrictions"
            label="Restrições médicas / Lesões"
            value={form.restrictions}
            onChange={e => update('restrictions', e.target.value)}
            placeholder="Ex: Hérnia de disco L4-L5, joelho direito..."
            rows={3}
          />
          <Textarea
            id="equipment"
            label="Equipamentos disponíveis"
            value={form.equipment}
            onChange={e => update('equipment', e.target.value)}
            placeholder="Ex: Academia completa, Halter até 30kg, Elásticos..."
            rows={2}
          />
          <Textarea
            id="notes"
            label="Observações gerais"
            value={form.notes}
            onChange={e => update('notes', e.target.value)}
            placeholder="Qualquer informação relevante sobre o aluno..."
            rows={3}
          />
        </div>
      </Card>

      {error && <p className="text-error text-body-sm mb-4">{error}</p>}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" loading={loading}>{isEdit ? 'Salvar alterações' : 'Criar aluno'}</Button>
      </div>
    </form>
  )
}
