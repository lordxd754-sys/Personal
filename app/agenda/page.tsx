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
  sessao:      'bg-primary/20 text-primary border-primary/30',
  avaliacao:   'bg-tertiary/20 text-tertiary border-tertiary/30',
  compromisso: 'bg-secondary/20 text-secondary border-secondary/30',
  outro:       'bg-surface-container text-on-surface-variant border-outline-variant',
}

const TYPE_LABELS: Record<string, string> = {
  sessao:      'Sessão',
  avaliacao:   'Avaliação',
  compromisso: 'Compromisso',
  outro:       'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  agendado:  'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function toDatetimeLocal(iso: string) {
  const d  = new Date(iso)
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h  = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da}T${h}:${mi}`
}

const emptyForm = {
  title:       '',
  description: '',
  studentId:   '',
  startAt:     '',
  endAt:       '',
  type:        'sessao'   as AgendaEvent['type'],
  status:      'agendado' as AgendaEvent['status'],
  notes:       '',
}

export default function AgendaPage() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events,        setEvents]        = useState<AgendaEvent[]>([])
  const [students,      setStudents]      = useState<Student[]>([])
  const [loading,       setLoading]       = useState(true)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [detailOpen,    setDetailOpen]    = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [form,          setForm]          = useState(emptyForm)
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState('')

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const from = new Date(year, month, 1).toISOString()
    const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    const res  = await fetch(`/api/agenda?from=${from}&to=${to}`)
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }, [year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  useEffect(() => {
    fetch('/api/students?status=ativo&limit=200')
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setStudents(Array.isArray(d) ? d : d.data ?? []))
  }, [])

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)) }
  function goToday()   { setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1)) }

  function openCreate(dateStr?: string) {
    setSelectedEvent(null)
    setForm({
      ...emptyForm,
      startAt: dateStr ? `${dateStr}T08:00` : '',
      endAt:   dateStr ? `${dateStr}T09:00` : '',
    })
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(ev: AgendaEvent) {
    setSelectedEvent(ev)
    setForm({
      title:       ev.title,
      description: ev.description ?? '',
      studentId:   ev.studentId   ?? '',
      startAt:     toDatetimeLocal(ev.startAt),
      endAt:       ev.endAt ? toDatetimeLocal(ev.endAt) : '',
      type:        ev.type,
      status:      ev.status,
      notes:       ev.notes ?? '',
    })
    setFormError('')
    setDetailOpen(false)
    setModalOpen(true)
  }

  function openDetail(ev: AgendaEvent) {
    setSelectedEvent(ev)
    setDetailOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError('Título obrigatório.'); return }
    if (!form.startAt)      { setFormError('Data/hora obrigatória.'); return }
    setSaving(true)
    setFormError('')

    const payload = {
      ...form,
      startAt:   new Date(form.startAt).toISOString(),
      endAt:     form.endAt ? new Date(form.endAt).toISOString() : null,
      studentId: form.studentId || null,
    }

    const isEdit = !!selectedEvent
    const res = await fetch(
      isEdit ? `/api/agenda/${selectedEvent!.id}` : '/api/agenda',
      { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    )

    if (res.ok) {
      setModalOpen(false)
      setSelectedEvent(null)
      fetchEvents()
    } else {
      const d = await res.json()
      setFormError(d.error ?? 'Erro ao salvar.')
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

  // --- Calendar grid ---
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Fix: compare using local date parts (not UTC string prefix) to handle timezone correctly
  function eventsForDay(day: number): AgendaEvent[] {
    return events.filter((e) => {
      const d = new Date(e.startAt)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const todayY = today.getFullYear()
  const todayM = today.getMonth()
  const todayD = today.getDate()

  const datetimeInputCls = 'w-full px-3 py-2 bg-surface-container-low border border-border-luminous rounded-lg text-on-surface text-body-md focus:outline-none focus:border-primary transition-all'

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-headline-sm font-semibold text-on-surface">Agenda</h1>
          <p className="text-body-md text-on-surface-variant mt-0.5">Gerencie suas sessões e compromissos</p>
        </div>
        <Button onClick={() => openCreate()}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo evento
        </Button>
      </div>

      {/* Calendar */}
      <div className="bento-card rounded-xl overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-luminous">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-headline-sm font-semibold text-on-surface">{MONTHS[month]} {year}</h2>
            <button
              onClick={goToday}
              className="text-label-caps text-primary hover:text-primary-fixed transition-colors"
            >
              Hoje
            </button>
          </div>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border-luminous">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-label-caps text-on-surface-variant">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant text-body-md">
            Carregando...
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="min-h-[88px] border-b border-r border-border-luminous bg-surface-container-lowest/30"
                  />
                )
              }
              const isToday = year === todayY && month === todayM && day === todayD
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = eventsForDay(day)

              return (
                <div
                  key={day}
                  className="min-h-[88px] border-b border-r border-border-luminous p-1.5 cursor-pointer hover:bg-surface-container/40 transition-colors group"
                  onClick={() => openCreate(dateStr)}
                >
                  <div
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-label-caps font-semibold mb-1 transition-colors ${
                      isToday
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant group-hover:text-on-surface'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); openDetail(ev) }}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate border transition-opacity ${TYPE_COLORS[ev.type]} ${ev.status === 'cancelado' ? 'opacity-40 line-through' : ''}`}
                      >
                        {new Date(ev.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-on-surface-variant pl-1">
                        +{dayEvents.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Evento" size="sm">
        {selectedEvent && (
          <div className="flex flex-col gap-4">
            <span
              className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-label-caps border ${TYPE_COLORS[selectedEvent.type]}`}
            >
              {TYPE_LABELS[selectedEvent.type]}
            </span>

            <div>
              <h3 className="text-headline-sm font-semibold text-on-surface">{selectedEvent.title}</h3>
              {selectedEvent.description && (
                <p className="text-body-md text-on-surface-variant mt-1">{selectedEvent.description}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 text-body-md text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">schedule</span>
                <span>
                  {new Date(selectedEvent.startAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  {selectedEvent.endAt &&
                    ` → ${new Date(selectedEvent.endAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
              {selectedEvent.student && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">person</span>
                  <span>{selectedEvent.student.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">flag</span>
                <span>{STATUS_LABELS[selectedEvent.status]}</span>
              </div>
            </div>

            {selectedEvent.notes && (
              <p className="text-body-md text-on-surface-variant bg-surface-container rounded-lg p-3">
                {selectedEvent.notes}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => openEdit(selectedEvent)}>
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Editar
              </Button>
              <Button variant="danger" onClick={() => handleDelete(selectedEvent.id)}>
                <span className="material-symbols-outlined text-[18px]">delete</span>
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
              <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Início</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                className={datetimeInputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Fim</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                className={datetimeInputCls}
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
                { value: 'sessao',      label: 'Sessão' },
                { value: 'avaliacao',   label: 'Avaliação' },
                { value: 'compromisso', label: 'Compromisso' },
                { value: 'outro',       label: 'Outro' },
              ]}
            />
            <Select
              id="status"
              label="Status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as AgendaEvent['status'] }))}
              options={[
                { value: 'agendado',  label: 'Agendado' },
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

          {formError && (
            <p className="text-error text-body-md">{formError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setModalOpen(false); setSelectedEvent(null) }}
            >
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
