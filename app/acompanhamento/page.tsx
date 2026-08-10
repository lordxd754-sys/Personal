'use client'
import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Textarea from '@/components/ui/Textarea'
import { getInitials, daysSince, formatDateTime } from '@/lib/utils'
import type { FollowUp } from '@/types'

type ContactFilter = 'todos' | 'vencidos' | 'atencao' | 'em_dia' | 'selecionados'

interface StudentWithUrgency {
  id: string
  name: string
  email: string | null
  phone: string | null
  goal: string | null
  level: string | null
  status: string
  lastContactAt: string | null
  days: number
}

const filters: Array<{ value: ContactFilter; label: string; icon: string }> = [
  { value: 'todos', label: 'Todos', icon: 'groups' },
  { value: 'vencidos', label: 'Vencidos', icon: 'priority_high' },
  { value: 'atencao', label: 'Atenção', icon: 'schedule' },
  { value: 'em_dia', label: 'Em dia', icon: 'verified' },
  { value: 'selecionados', label: 'Selecionados', icon: 'checklist' },
]

function contactStatus(days: number) {
  if (days > 15) return {
    label: 'Vencido',
    helper: `${days} dias sem contato`,
    badge: 'error' as const,
    icon: 'priority_high',
    row: 'border-error/20 bg-error/[0.03]',
  }
  if (days >= 11) return {
    label: 'Atenção',
    helper: `${days} dias sem contato`,
    badge: 'warning' as const,
    icon: 'schedule',
    row: 'border-warning/20 bg-warning/[0.03]',
  }
  return {
    label: 'Em dia',
    helper: days === 0 ? 'Contato hoje' : `${days} dias sem contato`,
    badge: 'success' as const,
    icon: 'check_circle',
    row: 'border-white/10 bg-surface-card',
  }
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-24 rounded-lg border border-white/10 bg-white/[0.04] animate-pulse" />
      ))}
    </div>
  )
}

export default function AcompanhamentoPage() {
  const [students, setStudents] = useState<StudentWithUrgency[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<ContactFilter>('todos')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUrgency | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [recentFollowUps, setRecentFollowUps] = useState<FollowUp[]>([])

  function fetchStudents() {
    const controller = new AbortController()
    if (students.length === 0) setLoading(true)
    else setRefreshing(true)

    fetch('/api/students?status=ativo&view=list&orderBy=lastContactAt', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then((data: StudentWithUrgency[]) => {
        const withDays = (Array.isArray(data) ? data : [])
          .map(s => ({ ...s, days: daysSince(s.lastContactAt) }))
          .sort((a, b) => b.days - a.days)
        setStudents(withDays)
      })
      .catch(() => {})
      .finally(() => {
        if (controller.signal.aborted) return
        setLoading(false)
        setRefreshing(false)
      })

    return () => controller.abort()
  }

  useEffect(() => fetchStudents(), [])

  const stats = useMemo(() => {
    const overdue = students.filter(s => s.days > 15).length
    const attention = students.filter(s => s.days >= 11 && s.days <= 15).length
    const ok = students.filter(s => s.days <= 10).length
    return { overdue, attention, ok, total: students.length }
  }, [students])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch = !query
        || student.name.toLowerCase().includes(query)
        || (student.email || '').toLowerCase().includes(query)
        || (student.goal || '').toLowerCase().includes(query)
      const matchesFilter =
        filter === 'todos'
        || (filter === 'vencidos' && student.days > 15)
        || (filter === 'atencao' && student.days >= 11 && student.days <= 15)
        || (filter === 'em_dia' && student.days <= 10)
        || (filter === 'selecionados' && selectedIds.has(student.id))
      return matchesSearch && matchesFilter
    })
  }, [filter, search, selectedIds, students])

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.has(student.id)),
    [selectedIds, students]
  )

  function toggleStudent(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleVisible() {
    setSelectedIds((current) => {
      const next = new Set(current)
      const visibleIds = filteredStudents.map((student) => student.id)
      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id))
      visibleIds.forEach((id) => {
        if (allVisibleSelected) next.delete(id)
        else next.add(id)
      })
      return next
    })
  }

  function applyContactLocally(ids: string[]) {
    const now = new Date().toISOString()
    setStudents((current) => current
      .map((student) => ids.includes(student.id)
        ? { ...student, lastContactAt: now, days: 0 }
        : student)
      .sort((a, b) => b.days - a.days)
    )
    setSelectedIds((current) => {
      const next = new Set(current)
      ids.forEach((id) => next.delete(id))
      return next
    })
  }

  async function openMessageModal(student: StudentWithUrgency) {
    setSelectedStudent(student)
    setMessage('')
    setRecentFollowUps([])
    const res = await fetch(`/api/students/${student.id}/followups`)
    const data = await res.json()
    setRecentFollowUps(Array.isArray(data) ? data.slice(0, 3) : [])
  }

  async function generateMessage() {
    if (!selectedStudent) return
    setGenerating(true)
    const res = await fetch('/api/followups/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id }),
    })
    const data = await res.json()
    if (data.message) setMessage(data.message)
    else alert(data.error || 'GEMINI_API_KEY não configurado')
    setGenerating(false)
  }

  async function sendEmail() {
    if (!selectedStudent || !message.trim()) return
    setSending(true)
    const res = await fetch('/api/followups/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id, message }),
    })
    const data = await res.json()
    if (data.success) {
      applyContactLocally([selectedStudent.id])
      setSelectedStudent(null)
      setMessage('')
    } else {
      alert(data.error || 'Erro ao enviar')
    }
    setSending(false)
  }

  async function registerManual(ids: string[], customMessage?: string) {
    if (ids.length === 0) return
    setSending(true)
    const res = await fetch('/api/followups/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentIds: ids,
        message: customMessage || 'Contato realizado e registrado manualmente.',
      }),
    })
    const data = await res.json()
    if (data.success) {
      applyContactLocally(ids)
      setSelectedStudent(null)
      setBulkOpen(false)
      setMessage('')
    } else {
      alert(data.error || 'Erro ao registrar contato')
    }
    setSending(false)
  }

  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every((student) => selectedIds.has(student.id))

  return (
    <AppLayout>
      <div className="p-4 md:p-8 xl:p-10 max-w-[1480px] mx-auto space-y-6">
        <section className="rounded-lg border border-white/10 bg-surface-card p-5 md:p-6">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary">forum</span>
                <span className="font-mono text-label-caps text-secondary uppercase">Central de relacionamento</span>
              </div>
              <h1 className="text-headline-lg-mobile md:text-headline-lg text-text-primary">Acompanhamento</h1>
              <p className="text-body-md text-on-surface-variant mt-2">
                Priorize contatos, registre conversas e mantenha a carteira ativa em ritmo saudável.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="secondary" onClick={fetchStudents} disabled={refreshing}>
                <span className={`material-symbols-outlined text-sm ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                Atualizar
              </Button>
              <Button onClick={() => setBulkOpen(true)} disabled={selectedIds.size === 0}>
                <span className="material-symbols-outlined text-sm">task_alt</span>
                Marcar contato ({selectedIds.size})
              </Button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="p-4">
            <p className="font-mono text-label-caps text-text-muted uppercase">Alunos ativos</p>
            <p className="text-[32px] leading-tight font-bold text-on-surface mt-2">{stats.total}</p>
          </Card>
          <Card className="p-4 border-error/20">
            <p className="font-mono text-label-caps text-error uppercase">Vencidos</p>
            <p className="text-[32px] leading-tight font-bold text-on-surface mt-2">{stats.overdue}</p>
          </Card>
          <Card className="p-4 border-warning/20">
            <p className="font-mono text-label-caps text-warning uppercase">Atenção</p>
            <p className="text-[32px] leading-tight font-bold text-on-surface mt-2">{stats.attention}</p>
          </Card>
          <Card className="p-4 border-success/20">
            <p className="font-mono text-label-caps text-success uppercase">Em dia</p>
            <p className="text-[32px] leading-tight font-bold text-on-surface mt-2">{stats.ok}</p>
          </Card>
        </section>

        <section className="rounded-lg border border-white/10 bg-surface-card p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome, e-mail ou objetivo..."
                className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary-container text-body-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {filters.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`h-10 px-3 rounded-lg border font-mono text-label-caps whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                    filter === item.value
                      ? 'bg-secondary text-on-secondary border-secondary'
                      : 'bg-white/[0.03] text-text-muted border-white/10 hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={toggleVisible}
              disabled={filteredStudents.length === 0}
              className="inline-flex items-center gap-2 text-label-md text-on-surface disabled:opacity-50"
            >
              <span className={`w-5 h-5 rounded border flex items-center justify-center ${allVisibleSelected ? 'bg-secondary border-secondary text-on-secondary' : 'border-white/20 bg-white/[0.03]'}`}>
                {allVisibleSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
              </span>
              Selecionar alunos visíveis
            </button>
            <p className="font-mono text-label-caps text-text-muted">
              {filteredStudents.length} exibido{filteredStudents.length !== 1 ? 's' : ''} · {selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}
            </p>
          </div>
        </section>

        {loading ? (
          <LoadingRows />
        ) : filteredStudents.length === 0 ? (
          <Card className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-text-muted block mb-3">manage_search</span>
            <p className="text-title-md text-text-primary">Nenhum aluno encontrado</p>
            <p className="text-body-sm text-text-muted mt-1">Ajuste os filtros ou a busca para ampliar a lista.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const status = contactStatus(student.days)
              const selected = selectedIds.has(student.id)
              return (
                <Card key={student.id} className={`p-0 overflow-hidden border ${selected ? 'border-secondary/50' : status.row}`}>
                  <div className="grid grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto] gap-4 p-4 md:p-5 items-center">
                    <button
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      aria-label={selected ? 'Remover seleção' : 'Selecionar aluno'}
                      className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                        selected ? 'bg-secondary border-secondary text-on-secondary' : 'bg-white/[0.03] border-white/20 text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[17px]">check</span>
                    </button>

                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-primary-container/10 border border-primary-container/30 flex items-center justify-center text-primary font-bold shrink-0">
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-title-md text-text-primary truncate">{student.name}</p>
                          <Badge variant={status.badge}>
                            <span className="material-symbols-outlined text-[14px]">{status.icon}</span>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-body-sm text-text-secondary truncate mt-1">{student.goal || 'Sem objetivo definido'}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-label-sm text-text-muted">
                          <span>{status.helper}</span>
                          <span>Último: {student.lastContactAt ? formatDateTime(student.lastContactAt) : 'nunca'}</span>
                          {student.email && <span className="truncate">{student.email}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 xl:col-span-1 flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => registerManual([student.id])} loading={sending}>
                        <span className="material-symbols-outlined text-sm">done</span>
                        Já contatei
                      </Button>
                      <Button size="sm" onClick={() => openMessageModal(student)}>
                        <span className="material-symbols-outlined text-sm">send</span>
                        Mensagem
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={bulkOpen}
        onClose={() => { setBulkOpen(false); setMessage('') }}
        title="Registrar contato em lote"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p className="text-label-md text-on-surface">{selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''} selecionado{selectedStudents.length !== 1 ? 's' : ''}</p>
            <p className="text-body-sm text-text-muted mt-1 line-clamp-2">
              {selectedStudents.map((student) => student.name).join(', ')}
            </p>
          </div>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Observação opcional para registrar junto ao contato..."
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="secondary" onClick={() => { setBulkOpen(false); setMessage('') }}>Cancelar</Button>
            <Button onClick={() => registerManual([...selectedIds], message)} loading={sending} disabled={selectedIds.size === 0}>
              <span className="material-symbols-outlined text-sm">task_alt</span>
              Registrar contatos
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!selectedStudent}
        onClose={() => { setSelectedStudent(null); setMessage('') }}
        title={`Mensagem para ${selectedStudent?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Digite a mensagem..."
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={generateMessage} loading={generating}>
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Gerar com IA
            </Button>
            <Button variant="secondary" size="sm" onClick={() => selectedStudent && registerManual([selectedStudent.id], message)} loading={sending}>
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Só registrar
            </Button>
          </div>

          {recentFollowUps.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="font-mono text-label-caps text-text-secondary uppercase mb-2">Últimas mensagens</p>
              <div className="space-y-2">
                {recentFollowUps.map(f => (
                  <div key={f.id} className="bg-surface-container-low border border-white/10 rounded-lg p-3">
                    <div className="flex justify-between gap-3 mb-1">
                      <span className="text-xs text-text-secondary capitalize">{f.channel}</span>
                      <span className="text-xs text-text-secondary">{formatDateTime(f.sentAt)}</span>
                    </div>
                    <p className="text-xs text-text-primary line-clamp-2">{f.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-3 border-t border-border">
            <Button variant="secondary" onClick={() => { setSelectedStudent(null); setMessage('') }}>Cancelar</Button>
            <Button onClick={sendEmail} loading={sending} disabled={!message.trim()}>
              <span className="material-symbols-outlined text-sm">mail</span>
              Enviar e-mail
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
