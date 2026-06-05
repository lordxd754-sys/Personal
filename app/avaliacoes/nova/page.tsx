'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Spinner from '@/components/ui/Spinner'
import { calculateAssessment, classifyBMI } from '@/lib/assessment'

interface Student { id: string; name: string; birthdate: string | null }

const DOBRAS = [
  {
    field: 'triceps',
    label: 'Tríceps',
    helper: 'Face posterior do braço, ponto médio entre acrômio e olécrano',
  },
  {
    field: 'subscapular',
    label: 'Subescapular',
    helper: '2 cm abaixo do ângulo inferior da escápula, diagonal 45°',
  },
  {
    field: 'pectoral',
    label: 'Peitoral',
    helper: 'Diagonal entre axila anterior e mamilo (1/3 proximal)',
  },
  {
    field: 'midaxillary',
    label: 'Axilar Média',
    helper: 'Linha axilar média, na altura do processo xifoide',
  },
  {
    field: 'suprailiac',
    label: 'Supra-ilíaca',
    helper: '2 cm acima da crista ilíaca, linha axilar anterior',
  },
  {
    field: 'abdominal',
    label: 'Abdominal',
    helper: '2 cm lateral à direita do umbigo, vertical',
  },
  {
    field: 'thigh',
    label: 'Coxa',
    helper: 'Face anterior da coxa, ponto médio entre prega inguinal e patela',
  },
]

const CIRCUNFERENCIAS = [
  { field: 'waistCm', label: 'Cintura (cm)' },
  { field: 'hipCm', label: 'Quadril (cm)' },
  { field: 'chestCm', label: 'Tórax (cm)' },
  { field: 'armCm', label: 'Braço direito (cm)' },
  { field: 'thighCm', label: 'Coxa direita (cm)' },
  { field: 'calfCm', label: 'Panturrilha direita (cm)' },
]

const COLOR_MAP = {
  blue: 'text-blue-400 bg-blue-500/10',
  green: 'text-emerald-400 bg-emerald-500/10',
  yellow: 'text-amber-400 bg-amber-500/10',
  red: 'text-red-400 bg-red-500/10',
}

function computeAge(birthdate: string | null): number {
  if (!birthdate) return 25
  return Math.floor((Date.now() - new Date(birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

function NovaAvaliacaoForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselectedId = searchParams.get('studentId') || ''

  const [student, setStudent] = useState<Student | null>(null)
  const [loadingStudent, setLoadingStudent] = useState(!!preselectedId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    weight: '',
    height: '',
    assessedAt: new Date().toISOString().split('T')[0],
    age: '',
    triceps: '',
    subscapular: '',
    pectoral: '',
    midaxillary: '',
    suprailiac: '',
    abdominal: '',
    thigh: '',
    waistCm: '',
    hipCm: '',
    chestCm: '',
    armCm: '',
    thighCm: '',
    calfCm: '',
    notes: '',
  })

  useEffect(() => {
    if (!preselectedId) return
    setLoadingStudent(true)
    fetch(`/api/students/${preselectedId}`)
      .then(r => r.json())
      .then((s: Student) => {
        setStudent(s)
        setForm(f => ({ ...f, age: String(computeAge(s.birthdate)) }))
      })
      .finally(() => setLoadingStudent(false))
  }, [preselectedId])

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  const w = parseFloat(form.weight) || 0
  const h = parseFloat(form.height) || 0
  const age = parseInt(form.age) || 25

  const dobrasValues = DOBRAS.map(d => parseFloat((form as Record<string, string>)[d.field]) || null)
  const allDobras = dobrasValues.every(v => v !== null && v > 0)

  const result = allDobras && w > 0 && h > 0
    ? calculateAssessment({
        weight: w,
        height: h,
        age,
        triceps: dobrasValues[0]!,
        subscapular: dobrasValues[1]!,
        pectoral: dobrasValues[2]!,
        midaxillary: dobrasValues[3]!,
        suprailiac: dobrasValues[4]!,
        abdominal: dobrasValues[5]!,
        thigh: dobrasValues[6]!,
      })
    : null

  const bmiRaw = w > 0 && h > 0 ? w / ((h / 100) ** 2) : null
  const bmiResult = bmiRaw ? classifyBMI(bmiRaw) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!preselectedId) { setError('Aluno não identificado'); return }
    if (!form.weight || !form.height) { setError('Peso e altura são obrigatórios'); return }
    setSaving(true)
    setError('')

    const payload = {
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      age,
      assessedAt: new Date(form.assessedAt + 'T12:00:00').toISOString(),
      triceps: parseFloat(form.triceps) || null,
      subscapular: parseFloat(form.subscapular) || null,
      pectoral: parseFloat(form.pectoral) || null,
      midaxillary: parseFloat(form.midaxillary) || null,
      suprailiac: parseFloat(form.suprailiac) || null,
      abdominal: parseFloat(form.abdominal) || null,
      thigh: parseFloat(form.thigh) || null,
      waistCm: parseFloat(form.waistCm) || null,
      hipCm: parseFloat(form.hipCm) || null,
      chestCm: parseFloat(form.chestCm) || null,
      armCm: parseFloat(form.armCm) || null,
      thighCm: parseFloat(form.thighCm) || null,
      calfCm: parseFloat(form.calfCm) || null,
      notes: form.notes || null,
    }

    try {
      const res = await fetch(`/api/students/${preselectedId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')
      router.push(`/alunos/${preselectedId}?tab=avaliacoes`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  if (loadingStudent) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </Button>
          <div>
            <h1 className="text-headline-md text-text-primary">Nova Avaliação Física</h1>
            <p className="text-body-sm text-text-secondary">
              Protocolo: 7 Dobras Cutâneas — Jackson &amp; Pollock
              {student ? ` · ${student.name}` : ''}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: form */}
            <div className="lg:col-span-2 space-y-4">
              {/* Section 1: Dados Básicos */}
              <Card>
                <h2 className="text-title-sm text-text-primary mb-4">Dados Básicos</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="weight"
                    label="Peso atual (kg)"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.weight}
                    onChange={e => update('weight', e.target.value)}
                    placeholder="Ex: 72.5"
                  />
                  <Input
                    id="height"
                    label="Altura (cm)"
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.height}
                    onChange={e => update('height', e.target.value)}
                    placeholder="Ex: 170"
                  />
                  <Input
                    id="age"
                    label="Idade"
                    type="number"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={e => update('age', e.target.value)}
                    placeholder="Ex: 30"
                  />
                  <Input
                    id="assessedAt"
                    label="Data da avaliação"
                    type="date"
                    value={form.assessedAt}
                    onChange={e => update('assessedAt', e.target.value)}
                  />
                </div>
              </Card>

              {/* Section 2: 7 Dobras */}
              <Card>
                <h2 className="text-title-sm text-text-primary mb-1">
                  7 Dobras Cutâneas
                  <span className="text-label-sm text-text-secondary font-normal ml-2">(mm)</span>
                </h2>
                <p className="text-body-sm text-text-secondary mb-4">Jackson &amp; Pollock</p>
                <div className="grid grid-cols-2 gap-4">
                  {DOBRAS.map(dobra => (
                    <div key={dobra.field}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-sm text-primary">push_pin</span>
                        <label htmlFor={dobra.field} className="text-label-sm text-text-primary">
                          {dobra.label}
                        </label>
                      </div>
                      <input
                        id={dobra.field}
                        type="number"
                        step="0.1"
                        min="0"
                        value={(form as Record<string, string>)[dobra.field]}
                        onChange={e => update(dobra.field, e.target.value)}
                        placeholder="mm"
                        className="w-full bg-surface-high border border-border rounded-md px-3 py-2 text-text-primary text-body-sm placeholder:text-text-tertiary focus:outline-none focus:border-primary"
                      />
                      <p className="text-xs text-text-secondary mt-1 leading-tight">{dobra.helper}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Section 3: Circunferências */}
              <Card>
                <h2 className="text-title-sm text-text-primary mb-1">
                  Circunferências
                  <span className="text-label-sm text-text-secondary font-normal ml-2">(opcional)</span>
                </h2>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {CIRCUNFERENCIAS.map(c => (
                    <Input
                      key={c.field}
                      id={c.field}
                      label={c.label}
                      type="number"
                      step="0.1"
                      min="0"
                      value={(form as Record<string, string>)[c.field]}
                      onChange={e => update(c.field, e.target.value)}
                      placeholder="cm"
                    />
                  ))}
                </div>
              </Card>

              {/* Section 4: Notes */}
              <Card>
                <Textarea
                  id="notes"
                  label="Observações"
                  value={form.notes}
                  onChange={e => update('notes', e.target.value)}
                  rows={3}
                  placeholder="Anotações sobre a avaliação..."
                />
              </Card>

              {error && (
                <p className="text-error text-body-sm bg-error/10 rounded-md px-4 py-2">{error}</p>
              )}

              <div className="flex gap-3 justify-end pb-6">
                <Button type="button" variant="secondary" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving}>
                  <span className="material-symbols-outlined text-base">save</span>
                  Salvar Avaliação
                </Button>
              </div>
            </div>

            {/* Right: preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-3">
                <Card className="border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-base">monitoring</span>
                    <h3 className="text-label-md text-text-primary font-semibold">Resultado Calculado</h3>
                  </div>

                  {!result ? (
                    <p className="text-body-sm text-text-secondary text-center py-4">
                      Preencha peso, altura e todas as 7 dobras para calcular
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-surface-high rounded-lg p-3">
                        <p className="text-label-sm text-text-secondary">Soma das 7 dobras</p>
                        <p className="text-title-md text-text-primary font-semibold">
                          {result.soma7dobras} mm
                        </p>
                      </div>

                      <div className="bg-surface-high rounded-lg p-3">
                        <p className="text-label-sm text-text-secondary">% Gordura Corporal</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-title-md text-text-primary font-semibold">
                            {result.bodyFatPercent}%
                          </p>
                          <span className={`text-label-sm px-2 py-0.5 rounded-full font-medium ${COLOR_MAP[result.classificationColor]}`}>
                            {result.classification}
                          </span>
                        </div>
                      </div>

                      <div className="bg-surface-high rounded-lg p-3">
                        <p className="text-label-sm text-text-secondary">Massa Magra</p>
                        <p className="text-title-md text-text-primary font-semibold">
                          {result.leanMassKg} kg
                        </p>
                      </div>

                      <div className="bg-surface-high rounded-lg p-3">
                        <p className="text-label-sm text-text-secondary">Massa Gorda</p>
                        <p className="text-title-md text-text-primary font-semibold">
                          {result.fatMassKg} kg
                        </p>
                      </div>

                      {bmiRaw && bmiResult && (
                        <div className="bg-surface-high rounded-lg p-3">
                          <p className="text-label-sm text-text-secondary">IMC</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-title-md text-text-primary font-semibold">
                              {(Math.round(bmiRaw * 10) / 10).toFixed(1)}
                            </p>
                            <span className={`text-label-sm px-2 py-0.5 rounded-full font-medium ${COLOR_MAP[bmiResult.color]}`}>
                              {bmiResult.label}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default function NovaAvaliacaoPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex justify-center py-16">
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    }>
      <NovaAvaliacaoForm />
    </Suspense>
  )
}
