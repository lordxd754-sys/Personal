'use client'
import { useEffect, useState, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

type Student = { id: string; name: string }

type AgendaEvent = {
  id: string
  title: string
  description?: string
  studentId?: string
  student?: { id: string; name: string } | null
  startAt: string
  endAt?: string
  type: 'sessao' | 'avaliacao' | 'compromisso' | 'outro'
  status: 'agendado' | 'concluido' | 'cancelado'
  notes?: string
}

const TYPE_COLORS: Record<string, string> = {
  sessao: 'bg-primary/20 text-primary border-primary/30',
  avaliacao: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  compromisso: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  outro: 'bg-surface-container text-text-secondary border-border',
}

const TYPE_LABELS: Record<string, string> = {
  sessao: 'Sessão',
  avaliacao: 'Avaliação',
  compromisso: 'Compromisso',
  outro: 'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function toLocalDateStr(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da}T${h}:${mi}`
}

const emptyForm = {
  title: '',
  description: '',
  studentId: '',
  startAt: '',
  endAt: '',
  type: 'sessao' as AgendaEvent['type'],
  status: 'agendado' as AgendaEvent['status'],
  notes: '',
}

export default function AgendaPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<AgendaEvent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const from = new Date(year, month, 1).toISOString()
    const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    const res = await fetch(`/api/agenda?from=${from}&to=${to}`)
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    fetch('/api/students?status=ativo&limit=200')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((d) => setStudents(Array.isArray(d) ? d : d.data ?? []))
  }, [])

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }
  function goToday() { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)) }

  function openCreate(dateStr?: string) {
    setForm({
      ...emptyForm,
      startAt: dateStr ? `${dateStr}T08:00` : '',
      endAt: dateStr ? `${dateStr}T09:00` : '',
    })
    setError('')
    setModalOpen(true)
  }

  function openEdit(ev: AgendaEvent) {
    setSelectedEvent(ev)
    setForm({
      title: ev.title,
      description: ev.description ?? '',
      studentId: ev.studentId ?? '',
      startAt: toDatetimeLocal(ev.startAt),
      endAt: ev.endAt ? toDatetimeLocal(ev.endAt) : '',
      type: ev.type,
      status: ev.status,
      notes: ev.notes ?? '',
    })
    setError('')
    setDetailOpen(false)
    setModalOpen(true)
  }

  function openDetail(ev: AgendaEvent) {
    setSelectedEvent(ev)
    setDetailOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Título obrigatório.'); return }
    if (!form.startAt) { setError('Data/hora obrigatória.'); return }
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      studentId: form.studentId || null,
    }

    const isEdit = !!selectedEvent
    const res = await fetch(isEdit ? `/api/agenda/${selectedEvent!.id}` : '/api/agenda', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setModalOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Erro ao salvar.')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
    setDetailOpen(false)
    setSelectedEvent(null)
    fetchEvents()
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = toLocalDateStr(today)

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  function eventsForDay(day: number) {
    const prefix = `${String(year)}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.startAt.startsWith(prefix))
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-sm text-text-primary">Agenda</h1>
          <p className="text-body-sm text-text-secondary mt-0.5">Gerencie suas sessões e compromissos</p>
        </div>
        <Button onClick={() => openCreate()}>
          <span className="material-symbols-outlined text-sm">add</span>
          Novo evento
        </Button>
      </div>

      {/* Calendar navigation */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg text-text-secondary">chevron_left</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-title-md text-text-primary">{MONTHS[month]} {year}</h2>
            <button onClick={goToday} className="text-label-sm text-primary hover:underline">Hoje</button>
          </div>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg text-text-secondary">chevron_right</span>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-label-sm text-text-secondary font-medium">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-text-secondary text-body-sm">Carregando...</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-border/50 bg-background/30" />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dateStr === todayStr
              const dayEvents = eventsForDay(day)
              return (
                <div
                  key={day}
                  className="min-h-[90px] border-b border-r border-border/50 p-1.5 cursor-pointer hover:bg-surface-container/30 transition-colors group"
                  onClick={() => openCreate(dateStr)}
                >
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-label-sm font-semibold mb-1 ${isToday ? 'bg-primary text-on-primary-container' : 'text-text-secondary group-hover:text-text-primary'}`}>
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); openDetail(ev) }}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate border ${TYPE_COLORS[ev.type]} ${ev.status === 'cancelado' ? 'opacity-40 line-through' : ''}`}
                      >
                        {new Date(ev.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-text-secondary pl-1">+{dayEvents.length - 3} mais</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Event detail modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Evento" size="sm">
        {selectedEvent && (
          <div className="flex flex-col gap-4">
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-label-sm border ${TYPE_COLORS[selectedEvent.type]}`}>
                {TYPE_LABELS[selectedEvent.type]}
              </span>
            </div>
            <div>
              <h3 className="text-title-sm text-text-primary">{selectedEvent.title}</h3>
              {selectedEvent.description && <p className="text-body-sm text-text-secondary mt-1">{selectedEvent.description}</p>}
            </div>
            <div className="flex flex-col gap-2 text-body-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>
                  {new Date(selectedEvent.startAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {selectedEvent.endAt && ` → ${new Date(selectedEvent.endAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
              {selectedEvent.student && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>{selectedEvent.student.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">flag</span>
                <span>{STATUS_LABELS[selectedEvent.status]}</span>
              </div>
            </div>
            {selectedEvent.notes && (
              <p className="text-body-sm text-text-secondary bg-surface-container rounded-lg p-3">{selectedEvent.notes}</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => openEdit(selectedEvent)}>
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar
              </Button>
              <Button variant="danger" onClick={() => handleDelete(selectedEvent.id)}>
                <span className="material-symbols-outlined text-sm">delete</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedEvent(null) }}
        title={selectedEvent ? 'Editar evento' : 'Novo evento'}
        size="md"
      >
        <div className="flex flex-col gap-4">
          <Input
            id="title"
            label="Título"
            placeholder="Ex: Treino de força"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-text-muted">Início</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                className="px-3 py-2 bg-surface-container-lowest border border-surface-border rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-text-muted">Fim</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                className="px-3 py-2 bg-surface-container-lowest border border-surface-border rounded-lg text-on-surface text-body-sm focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="type"
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AgendaEvent['type'] }))}
              options={[
                { value: 'sessao', label: 'Sessão' },
                { value: 'avaliacao', label: 'Avaliação' },
                { value: 'compromisso', label: 'Compromisso' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
            <Select
              id="status"
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AgendaEvent['status'] }))}
              options={[
                { value: 'agendado', label: 'Agendado' },
                { value: 'concluido', label: 'Concluído' },
                { value: 'cancelado', label: 'Cancelado' },
              ]}
            />
          </div>
          <Select
            id="student"
            label="Aluno (opcional)"
            value={form.studentId}
            onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
            options={[
              { value: '', label: 'Nenhum' },
              ...students.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
          <Textarea
            id="description"
            label="Descrição"
            placeholder="Detalhes do evento..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
          />
          <Textarea
            id="notes"
            label="Notas internas"
            placeholder="Observações privadas..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
          />
          {error && <p className="text-error text-body-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => { setModalOpen(false); setSelectedEvent(null) }}>
              Cancelar
            </Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {selectedEvent ? 'Salvar' : 'Criar evento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
