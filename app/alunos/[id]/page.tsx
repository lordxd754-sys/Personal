'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import Textarea from '@/components/ui/Textarea'
import Link from 'next/link'
import { formatDate, formatDateTime, getInitials } from '@/lib/utils'
import type { Student, PhysicalAssessment, Photo, Workout, FollowUp } from '@/types'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type Tab = 'dados' | 'avaliacoes' | 'fotos' | 'treinos' | 'acompanhamento'

const workoutStatusMap: Record<string, { label: string; variant: 'neutral' | 'success' | 'info' }> = {
  rascunho: { label: 'Rascunho', variant: 'neutral' },
  aprovado: { label: 'Aprovado', variant: 'success' },
  enviado_mfit: { label: 'No MFIT', variant: 'info' },
}

function statusBadge(s: string) {
  const map: Record<string, 'success' | 'warning' | 'neutral'> = {
    ativo: 'success',
    pausado: 'warning',
    inativo: 'neutral',
  }
  const labels: Record<string, string> = { ativo: 'Ativo', pausado: 'Pausado', inativo: 'Inativo' }
  return <Badge variant={map[s] || 'neutral'}>{labels[s] || s}</Badge>
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  'Atlético': 'text-blue-400 bg-blue-500/10',
  'Excelente': 'text-emerald-400 bg-emerald-500/10',
  'Bom': 'text-emerald-400 bg-emerald-500/10',
  'Acima da média': 'text-amber-400 bg-amber-500/10',
  'Obesidade leve': 'text-red-400 bg-red-500/10',
  'Obesidade severa': 'text-red-400 bg-red-500/10',
}

function deltaBadge(curr: number | null, prev: number | null, lowerIsBetter = false) {
  if (curr == null || prev == null) return null
  const d = Math.round((curr - prev) * 10) / 10
  if (d === 0) return null
  const isImprovement = lowerIsBetter ? d < 0 : d > 0
  const sign = d > 0 ? '+' : ''
  return (
    <span className={`text-xs font-medium ${isImprovement ? 'text-emerald-400' : 'text-red-400'}`}>
      {sign}{d}
    </span>
  )
}

export default function AlunoPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'dados')
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(new Set())

  // Message modal
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [generatingMsg, setGeneratingMsg] = useState(false)
  const [sendingMsg, setSendingMsg] = useState(false)

  // Photo upload
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoAngle, setPhotoAngle] = useState('frente')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  async function loadAll() {
    setLoading(true)
    try {
      const [studRes, assessRes, photoRes, workRes, fuRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/students/${studentId}/assessments`),
        fetch(`/api/students/${studentId}/photos`),
        fetch(`/api/students/${studentId}/workouts`),
        fetch(`/api/students/${studentId}/followups`),
      ])
      setStudent(await studRes.json())
      setAssessments(await assessRes.json())
      setPhotos(await photoRes.json())
      setWorkouts(await workRes.json())
      try {
        const fuData = await fuRes.json()
        setFollowUps(Array.isArray(fuData) ? fuData : [])
      } catch {
        setFollowUps([])
      }
    } catch {
      // keep whatever was loaded
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [studentId])

  async function generateMessage() {
    setGeneratingMsg(true)
    try {
      const res = await fetch('/api/followups/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (data.message) setMessageText(data.message)
      else if (data.error) alert(data.error)
    } catch {
      alert('Erro ao gerar mensagem')
    }
    setGeneratingMsg(false)
  }

  async function sendEmail() {
    setSendingMsg(true)
    try {
      const res = await fetch('/api/followups/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, message: messageText }),
      })
      const data = await res.json()
      if (data.success) {
        setShowMessageModal(false)
        setMessageText('')
        loadAll()
      } else {
        alert(data.error || 'Erro ao enviar')
      }
    } catch {
      alert('Erro ao enviar e-mail')
    }
    setSendingMsg(false)
  }

  async function registerManual() {
    setSendingMsg(true)
    try {
      const res = await fetch('/api/followups/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, message: messageText }),
      })
      const data = await res.json()
      if (data.success) {
        setShowMessageModal(false)
        setMessageText('')
        loadAll()
      } else {
        alert(data.error)
      }
    } catch {
      alert('Erro ao registrar')
    }
    setSendingMsg(false)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('angle', photoAngle)
    const res = await fetch(`/api/students/${studentId}/photos`, { method: 'POST', body: fd })
    if (res.ok) loadAll()
    setUploadingPhoto(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function deletePhoto(photoId: string) {
    if (!confirm('Excluir esta foto?')) return
    await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    loadAll()
  }

  async function deleteStudent() {
    if (!confirm(`Excluir o aluno ${student?.name}? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/students/${studentId}`, { method: 'DELETE' })
    router.push('/alunos')
  }

  async function createWorkout(type: 'manual' | 'ai') {
    const res = await fetch(`/api/students/${studentId}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Novo Treino' }),
    })
    const data = await res.json()
    if (data.id) {
      router.push(type === 'ai' ? `/treinos/${data.id}?generate=true` : `/treinos/${data.id}`)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16">
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    )
  }

  if (!student) {
    return (
      <AppLayout>
        <div className="p-6 text-text-secondary">Aluno não encontrado.</div>
      </AppLayout>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dados', label: 'Dados', icon: 'person' },
    { id: 'avaliacoes', label: 'Avaliações', icon: 'monitoring' },
    { id: 'fotos', label: 'Fotos', icon: 'photo_library' },
    { id: 'treinos', label: 'Treinos', icon: 'fitness_center' },
    { id: 'acompanhamento', label: 'Acompanhamento', icon: 'mail' },
  ]

  const chartData = [...assessments].reverse().map((a) => ({
    date: formatDate(a.assessedAt),
    'Peso (kg)': a.weight,
    '% Gordura': a.bodyFatPercent,
    'Massa Magra (kg)': a.leanMassKg,
  }))

  const photosByDate = photos.reduce<Record<string, Photo[]>>((acc, p) => {
    const d = formatDate(p.takenAt)
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {})

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-headline-md font-bold shrink-0">
              {getInitials(student.name)}
            </div>
            <div>
              <h1 className="text-headline-md text-text-primary">{student.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {statusBadge(student.status)}
                <span className="text-body-sm text-text-secondary">
                  {student.goal || 'Sem objetivo definido'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link href={`/alunos/${studentId}/editar`}>
              <Button variant="secondary" size="sm">
                <span className="material-symbols-outlined text-base">edit</span>
                Editar
              </Button>
            </Link>
            <Button variant="danger" size="sm" onClick={deleteStudent}>
              <span className="material-symbols-outlined text-base">delete</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-label-md whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-high'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'dados' && (
          <Card>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  ['E-mail', student.email],
                  ['Telefone', student.phone],
                  ['Data de nascimento', student.birthdate ? formatDate(student.birthdate) : null],
                  [
                    'Cidade / Estado',
                    [student.city, student.state].filter(Boolean).join(' / ') || null,
                  ],
                  ['Nível', student.level],
                  ['Dias por semana', `${student.daysPerWeek} dias`],
                  ['Duração da sessão', `${student.sessionDuration} min`],
                  ['ID MFIT', student.mfitId],
                  [
                    'Último contato',
                    student.lastContactAt ? formatDateTime(student.lastContactAt) : 'Nunca',
                  ],
                ] as [string, string | null | undefined][]
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-label-sm text-text-secondary uppercase tracking-wide">{label}</p>
                  <p className="text-body-md text-text-primary mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>
            {student.restrictions && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-label-sm text-text-secondary uppercase tracking-wide mb-1">
                  Restrições / Lesões
                </p>
                <p className="text-body-sm text-text-primary">{student.restrictions}</p>
              </div>
            )}
            {student.equipment && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-label-sm text-text-secondary uppercase tracking-wide mb-1">
                  Equipamentos
                </p>
                <p className="text-body-sm text-text-primary">{student.equipment}</p>
              </div>
            )}
            {student.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-label-sm text-text-secondary uppercase tracking-wide mb-1">
                  Observações
                </p>
                <p className="text-body-sm text-text-primary">{student.notes}</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'avaliacoes' && (() => {
          const current = assessments[0] ?? null
          const previous = assessments[1] ?? null

          return (
            <div className="flex flex-col gap-4">
              {/* Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-title-md text-text-primary">
                  Avaliações Físicas ({assessments.length})
                </h2>
                <Link href={`/avaliacoes/nova?studentId=${studentId}`}>
                  <Button size="sm">
                    <span className="material-symbols-outlined text-base">add</span>
                    Nova Avaliação
                  </Button>
                </Link>
              </div>

              {/* Empty state */}
              {assessments.length === 0 && (
                <Card className="text-center py-12">
                  <span className="material-symbols-outlined text-4xl text-text-secondary block mb-2">
                    monitor_weight
                  </span>
                  <p className="text-body-md text-text-secondary mb-4">Nenhuma avaliação registrada</p>
                  <Link href={`/avaliacoes/nova?studentId=${studentId}`}>
                    <Button size="sm">
                      <span className="material-symbols-outlined text-base">add</span>
                      Registrar primeira avaliação
                    </Button>
                  </Link>
                </Card>
              )}

              {/* Summary cards (most recent) */}
              {current && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { label: '% Gordura', value: current.bodyFatPercent != null ? `${current.bodyFatPercent}%` : '—', prev: previous?.bodyFatPercent ?? null, curr: current.bodyFatPercent, lowerBetter: true },
                    { label: 'Peso', value: `${current.weight} kg`, prev: previous?.weight ?? null, curr: current.weight, lowerBetter: false },
                    { label: 'Massa Magra', value: current.leanMassKg != null ? `${current.leanMassKg} kg` : '—', prev: previous?.leanMassKg ?? null, curr: current.leanMassKg, lowerBetter: false },
                    { label: 'IMC', value: current.bmi != null ? String(current.bmi) : '—', prev: previous?.bmi ?? null, curr: current.bmi, lowerBetter: true },
                  ] as { label: string; value: string; prev: number | null; curr: number | null; lowerBetter: boolean }[]).map(({ label, value, prev, curr, lowerBetter }) => (
                    <div key={label} className="bg-surface-high rounded-lg p-3 border border-border">
                      <p className="text-label-sm text-text-secondary">{label}</p>
                      <p className="text-title-md text-text-primary font-semibold">{value}</p>
                      {previous && (
                        <div className="flex items-center gap-1 mt-1">
                          {deltaBadge(curr, prev, lowerBetter)}
                          {curr !== null && prev !== null && curr !== prev && (
                            <span className="text-xs text-text-tertiary">vs anterior</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Evolution chart */}
              {assessments.length >= 2 && (
                <Card>
                  <h3 className="text-label-md text-text-secondary mb-4">Evolução</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                      <XAxis dataKey="date" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: '#1A1A1A',
                          border: '1px solid #27272A',
                          borderRadius: 8,
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Peso (kg)" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                      <Line type="monotone" dataKey="% Gordura" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B' }} />
                      <Line type="monotone" dataKey="Massa Magra (kg)" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {assessments.length === 1 && (
                <p className="text-body-sm text-text-secondary text-center py-2">
                  Registre mais avaliações para ver a evolução
                </p>
              )}

              {/* Assessment cards */}
              {assessments.map((a) => {
                const expanded = expandedAssessments.has(a.id)
                const hasCircumferences = a.waistCm || a.hipCm || a.chestCm || a.armCm || a.thighCm || a.calfCm
                const hasDobras = a.triceps || a.subscapular || a.pectoral || a.midaxillary || a.suprailiac || a.abdominal || a.thigh

                return (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-label-md text-text-primary">{formatDate(a.assessedAt)}</p>
                        {a.classification && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${CLASSIFICATION_COLORS[a.classification] ?? 'text-text-secondary bg-surface-high'}`}>
                            {a.classification}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedAssessments(prev => {
                            const next = new Set(prev)
                            next.has(a.id) ? next.delete(a.id) : next.add(a.id)
                            return next
                          })}
                        >
                          <span className="material-symbols-outlined text-base text-text-secondary">
                            {expanded ? 'expand_less' : 'expand_more'}
                          </span>
                          <span className="text-label-sm text-text-secondary">
                            {expanded ? 'Ocultar' : 'Ver detalhes'}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Excluir avaliação?')) {
                              await fetch(`/api/assessments/${a.id}`, { method: 'DELETE' })
                              loadAll()
                            }
                          }}
                        >
                          <span className="material-symbols-outlined text-base text-error">delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {([
                        ['Peso', `${a.weight} kg`],
                        ['% Gordura', a.bodyFatPercent != null ? `${a.bodyFatPercent}%` : '—'],
                        ['Massa Magra', a.leanMassKg != null ? `${a.leanMassKg} kg` : '—'],
                        ['IMC', a.bmi != null ? String(a.bmi) : '—'],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="bg-surface-high rounded-md p-3">
                          <p className="text-label-sm text-text-secondary">{label}</p>
                          <p className="text-title-md text-text-primary">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Accordion detail */}
                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4">
                        {hasDobras && (
                          <div>
                            <p className="text-label-sm text-text-secondary uppercase tracking-wide mb-3">7 Dobras Cutâneas (mm)</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {([
                                ['Tríceps', a.triceps],
                                ['Subescapular', a.subscapular],
                                ['Peitoral', a.pectoral],
                                ['Axilar Média', a.midaxillary],
                                ['Supra-ilíaca', a.suprailiac],
                                ['Abdominal', a.abdominal],
                                ['Coxa', a.thigh],
                              ] as [string, number | null][]).map(([label, value]) => (
                                <div key={label} className="bg-surface rounded-md p-2 text-center">
                                  <p className="text-xs text-text-secondary leading-tight">{label}</p>
                                  <p className="text-label-md text-text-primary font-semibold mt-0.5">
                                    {value != null ? `${value}` : '—'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {hasCircumferences && (
                          <div>
                            <p className="text-label-sm text-text-secondary uppercase tracking-wide mb-3">Circunferências (cm)</p>
                            <div className="grid grid-cols-3 gap-2">
                              {([
                                ['Cintura', a.waistCm],
                                ['Quadril', a.hipCm],
                                ['Tórax', a.chestCm],
                                ['Braço', a.armCm],
                                ['Coxa', a.thighCm],
                                ['Panturrilha', a.calfCm],
                              ] as [string, number | null][]).filter(([, v]) => v != null).map(([label, value]) => (
                                <div key={label} className="bg-surface rounded-md p-2 text-center">
                                  <p className="text-xs text-text-secondary leading-tight">{label}</p>
                                  <p className="text-label-md text-text-primary font-semibold mt-0.5">{value} cm</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {a.notes && (
                          <div>
                            <p className="text-label-sm text-text-secondary uppercase tracking-wide mb-1">Observações</p>
                            <p className="text-body-sm text-text-primary">{a.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )
        })()}

        {activeTab === 'fotos' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-md text-text-primary">Fotos ({photos.length})</h2>
              <div className="flex gap-2 items-center">
                <select
                  value={photoAngle}
                  onChange={(e) => setPhotoAngle(e.target.value)}
                  className="bg-[#141414] border border-border rounded-md px-3 py-1.5 text-text-primary text-body-sm"
                >
                  <option value="frente">Frente</option>
                  <option value="costas">Costas</option>
                  <option value="lateral">Lateral</option>
                </select>
                <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploadingPhoto}>
                  <span className="material-symbols-outlined text-base">upload</span>
                  Upload
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>
            {photos.length === 0 ? (
              <Card className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-text-secondary block mb-2">
                  photo_library
                </span>
                <p className="text-body-md text-text-secondary">Nenhuma foto cadastrada</p>
              </Card>
            ) : (
              Object.entries(photosByDate).map(([date, datePhotos]) => (
                <div key={date}>
                  <p className="text-label-md text-text-secondary mb-2">{date}</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {datePhotos.map((p) => (
                      <div
                        key={p.id}
                        className="relative group aspect-[3/4] bg-surface-high rounded-lg overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt={p.angle || ''}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                          <p className="text-label-sm text-white capitalize">{p.angle}</p>
                          <button
                            onClick={() => deletePhoto(p.id)}
                            className="text-error text-label-sm"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'treinos' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-md text-text-primary">Treinos ({workouts.length})</h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => createWorkout('manual')}>
                  <span className="material-symbols-outlined text-base">add</span>
                  Manual
                </Button>
                <Button size="sm" onClick={() => createWorkout('ai')}>
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  Gerar com IA
                </Button>
              </div>
            </div>
            {workouts.length === 0 ? (
              <Card className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-text-secondary block mb-2">
                  fitness_center
                </span>
                <p className="text-body-md text-text-secondary">Nenhum treino cadastrado</p>
              </Card>
            ) : (
              workouts.map((w) => {
                const { label, variant } = workoutStatusMap[w.status] || {
                  label: w.status,
                  variant: 'neutral' as const,
                }
                return (
                  <Link key={w.id} href={`/treinos/${w.id}`}>
                    <Card className="hover:border-primary/30 transition-colors cursor-pointer p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-label-md text-text-primary">{w.title}</p>
                          <p className="text-label-sm text-text-secondary mt-0.5">
                            {formatDate(w.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={variant}>{label}</Badge>
                          <span className="material-symbols-outlined text-text-secondary">
                            chevron_right
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'acompanhamento' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title-md text-text-primary">Acompanhamento</h2>
              <Button size="sm" onClick={() => setShowMessageModal(true)}>
                <span className="material-symbols-outlined text-base">send</span>
                Enviar mensagem
              </Button>
            </div>
            {followUps.length === 0 ? (
              <Card className="text-center py-12">
                <span className="material-symbols-outlined text-4xl text-text-secondary block mb-2">
                  mail
                </span>
                <p className="text-body-md text-text-secondary">Nenhum acompanhamento registrado</p>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {followUps.map((f) => (
                  <Card key={f.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">
                          {f.channel === 'email' ? 'mail' : 'check_circle'}
                        </span>
                        <span className="text-label-sm text-text-secondary capitalize">
                          {f.channel}
                        </span>
                        {f.autoGenerated && <Badge variant="info">IA</Badge>}
                      </div>
                      <p className="text-label-sm text-text-secondary">{formatDateTime(f.sentAt)}</p>
                    </div>
                    <p className="text-body-sm text-text-primary">{f.message}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Modal */}
      <Modal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title="Enviar mensagem"
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-text-secondary">
            Para: <span className="text-text-primary">{student.name}</span>
          </p>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
            placeholder="Digite a mensagem..."
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={generateMessage}
              loading={generatingMsg}
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              Gerar com IA
            </Button>
          </div>
          <div className="flex gap-2 justify-end border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={registerManual}
              loading={sendingMsg}
              disabled={!messageText}
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              Registrar como enviado
            </Button>
            <Button onClick={sendEmail} loading={sendingMsg} disabled={!messageText}>
              <span className="material-symbols-outlined text-base">send</span>
              Enviar e-mail
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
