'use client'
import { useState, useEffect, useCallback } from 'react'
import { signIn, useSession } from 'next-auth/react'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import type { CalendarEvent, GoogleEventInput } from '@/lib/google-calendar'
import { GOOGLE_COLORS } from '@/lib/calendar-colors'

type ViewMode = 'month' | 'week' | 'day' | 'agenda'

const PT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PT_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const PT_MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function eventColor(e: CalendarEvent) {
  return e.color || '#adc7ff'
}

// ─── Event Modal ─────────────────────────────────────────────────────────────
interface EventModalProps {
  onClose: () => void
  onSave: (data: GoogleEventInput) => Promise<void>
  initial?: Partial<GoogleEventInput & { id: string }>
  students: { id: string; name: string; goal: string | null }[]
}

function EventModal({ onClose, onSave, initial, students }: EventModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [allDay, setAllDay] = useState(initial?.allDay ?? false)
  const [startDT, setStartDT] = useState(initial?.startDateTime ?? initial?.startDate ?? new Date().toISOString().slice(0, 16))
  const [endDT, setEndDT] = useState(initial?.endDateTime ?? initial?.endDate ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [colorId, setColorId] = useState(initial?.colorId ?? '')
  const [reminderMinutes, setReminderMinutes] = useState(initial?.reminderMinutes ?? 30)
  const [attendeeInput, setAttendeeInput] = useState('')
  const [attendees, setAttendees] = useState<string[]>(initial?.attendees ?? [])
  const [saving, setSaving] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [showStudents, setShowStudents] = useState(false)

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(studentQuery.toLowerCase())).slice(0, 5)

  function selectStudent(s: { name: string; goal: string | null }) {
    setTitle(prev => prev || `Sessão com ${s.name}`)
    setDescription(`Sessão com ${s.name}${s.goal ? ` — Objetivo: ${s.goal}` : ''}`)
    setStudentQuery(s.name)
    setShowStudents(false)
  }

  function addAttendee() {
    if (attendeeInput && attendeeInput.includes('@') && !attendees.includes(attendeeInput)) {
      setAttendees(a => [...a, attendeeInput])
      setAttendeeInput('')
    }
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({
        title,
        allDay,
        startDateTime: allDay ? undefined : startDT,
        endDateTime: allDay ? undefined : endDT || startDT,
        startDate: allDay ? startDT.slice(0, 10) : undefined,
        endDate: allDay ? (endDT || startDT).slice(0, 10) : undefined,
        location: location || undefined,
        description: description || undefined,
        colorId: colorId || undefined,
        reminderMinutes,
        attendees: attendees.length ? attendees : undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-title-md text-on-surface">{initial?.id ? 'Editar evento' : 'Novo evento'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Adicionar título"
            className="w-full bg-transparent border-b border-surface-border text-xl text-on-surface placeholder-text-muted outline-none pb-2 focus:border-primary"
          />

          {/* All day toggle + dates */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setAllDay(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${allDay ? 'bg-primary-container' : 'bg-surface-container-high'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${allDay ? 'left-5 bg-on-primary' : 'left-0.5 bg-text-muted'}`} />
              </div>
              <span className="text-label-caps text-text-muted">Dia inteiro</span>
            </label>
            <div className="flex gap-2">
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={startDT}
                onChange={e => setStartDT(e.target.value)}
                className="flex-1 bg-surface-container border border-surface-border rounded-lg px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary"
              />
              <span className="text-text-muted self-center">→</span>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={endDT}
                onChange={e => setEndDT(e.target.value)}
                className="flex-1 bg-surface-container border border-surface-border rounded-lg px-3 py-2 text-body-sm text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Student autocomplete */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-surface-container border border-surface-border rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-text-muted text-lg">person</span>
              <input
                value={studentQuery}
                onChange={e => { setStudentQuery(e.target.value); setShowStudents(true) }}
                onFocus={() => setShowStudents(true)}
                placeholder="Vincular aluno"
                className="flex-1 bg-transparent text-body-sm text-on-surface placeholder-text-muted outline-none"
              />
            </div>
            {showStudents && studentQuery && filteredStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-card border border-surface-border rounded-lg overflow-hidden z-10 shadow-xl">
                {filteredStudents.map(s => (
                  <button
                    key={s.id}
                    onMouseDown={() => selectStudent(s)}
                    className="w-full text-left px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-high"
                  >
                    {s.name}
                    {s.goal && <span className="text-text-muted ml-2">— {s.goal}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 bg-surface-container border border-surface-border rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-text-muted text-lg">location_on</span>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Adicionar local"
              className="flex-1 bg-transparent text-body-sm text-on-surface placeholder-text-muted outline-none"
            />
          </div>

          {/* Description */}
          <div className="flex gap-2 bg-surface-container border border-surface-border rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-text-muted text-lg mt-0.5">notes</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Adicionar descrição"
              rows={3}
              className="flex-1 bg-transparent text-body-sm text-on-surface placeholder-text-muted outline-none resize-none"
            />
          </div>

          {/* Reminder + Color */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-surface-container border border-surface-border rounded-lg px-3 py-2 flex-1 min-w-[160px]">
              <span className="material-symbols-outlined text-text-muted text-lg">notifications</span>
              <select
                value={reminderMinutes}
                onChange={e => setReminderMinutes(Number(e.target.value))}
                className="flex-1 bg-transparent text-body-sm text-on-surface outline-none"
              >
                <option value={5}>5 minutos</option>
                <option value={10}>10 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={1440}>1 dia</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(GOOGLE_COLORS).map(([id, color]) => (
                <button
                  key={id}
                  onClick={() => setColorId(id === colorId ? '' : id)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full transition-transform ${colorId === id ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-surface-card' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1 bg-surface-container border border-surface-border rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-text-muted text-lg">group_add</span>
                <input
                  value={attendeeInput}
                  onChange={e => setAttendeeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addAttendee()}
                  placeholder="Adicionar convidado por e-mail"
                  className="flex-1 bg-transparent text-body-sm text-on-surface placeholder-text-muted outline-none"
                />
              </div>
              <button onClick={addAttendee} className="px-3 py-2 bg-surface-container-high border border-surface-border rounded-lg text-text-muted hover:text-on-surface text-body-sm">
                +
              </button>
            </div>
            {attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attendees.map(a => (
                  <span key={a} className="flex items-center gap-1 bg-primary-container/20 text-primary text-label-caps rounded-full px-3 py-1">
                    {a}
                    <button onClick={() => setAttendees(prev => prev.filter(x => x !== a))}>
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-surface-border">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSave} loading={saving} disabled={!title.trim()}>
            Salvar evento
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Event Popover ────────────────────────────────────────────────────────────
function EventPopover({ event, onClose, onEdit, onDelete }: {
  event: CalendarEvent
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const color = eventColor(event)
  const start = event.allDay ? event.start : new Date(event.start)
  const end = event.allDay ? event.end : new Date(event.end)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
            <h3 className="text-title-md text-on-surface">{event.title}</h3>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
            <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-error rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-text-muted hover:text-on-surface rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-lg text-text-muted">schedule</span>
            <span>
              {event.allDay
                ? `${event.start}`
                : `${(start as Date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })} · ${formatTime(event.start)} – ${formatTime(event.end)}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-lg text-text-muted">location_on</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.description && (
            <div className="flex items-start gap-3 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-lg text-text-muted">notes</span>
              <span className="line-clamp-3">{event.description}</span>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-lg text-text-muted">group</span>
              <span>{event.attendees.join(', ')}</span>
            </div>
          )}
        </div>

        {event.htmlLink && (
          <div className="px-4 pb-4 flex gap-2">
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 border border-surface-border rounded-lg text-label-caps text-text-muted hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-lg">open_in_new</span>
              Abrir no Google
            </a>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-container text-on-primary-container rounded-lg text-label-caps font-semibold hover:bg-primary-dim transition-colors"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Not Connected Screen ──────────────────────────────────────────────────────
function NotConnected() {
  const [loading, setLoading] = useState(false)
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary-container/20 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
        </div>
        <h2 className="text-headline-md text-on-surface mb-2">Conecte sua conta Google</h2>
        <p className="text-body-md text-text-muted mb-6">
          Sincronize sua agenda com o Google Calendar e gerencie todos os seus compromissos em um só lugar.
        </p>
        <div className="space-y-2 text-body-sm text-text-muted mb-8 text-left">
          {['Visualize eventos em tempo real', 'Crie e edite compromissos', 'Vincule sessões aos seus alunos', 'Receba lembretes automáticos'].map(f => (
            <div key={f} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-success text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {f}
            </div>
          ))}
        </div>
        <Button
          loading={loading}
          onClick={() => { setLoading(true); signIn('google', { callbackUrl: '/agenda' }) }}
          className="w-full gap-2"
        >
          <span className="material-symbols-outlined text-lg">login</span>
          Conectar com Google
        </Button>
        <p className="text-label-caps text-text-muted mt-4">
          Suas informações são privadas e seguras. Acesso apenas à agenda.
        </p>
      </div>
    </div>
  )
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({ date, events, onDayClick, onEventClick }: {
  date: Date
  events: CalendarEvent[]
  onDayClick: (d: Date) => void
  onEventClick: (e: CalendarEvent) => void
}) {
  const today = new Date()
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-surface-border">
        {PT_DAYS.map(d => (
          <div key={d} className="py-2 text-center text-label-caps text-text-muted font-semibold">{d}</div>
        ))}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="border-b border-r border-surface-border min-h-[100px]" />
          const dayEvents = events.filter(e => {
            const s = e.allDay ? new Date(e.start) : new Date(e.start)
            return isSameDay(s, day)
          })
          const isToday = isSameDay(day, today)
          const isCurrentMonth = day.getMonth() === month
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`border-b border-r border-surface-border min-h-[100px] p-1 cursor-pointer hover:bg-surface-container/30 transition-colors ${!isCurrentMonth ? 'opacity-40' : ''}`}
            >
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-label-caps font-semibold mb-1 ${isToday ? 'bg-primary-container text-on-primary-container' : 'text-text-muted'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <div
                    key={e.id}
                    onClick={ev => { ev.stopPropagation(); onEventClick(e) }}
                    style={{ backgroundColor: `${eventColor(e)}20`, borderLeftColor: eventColor(e) }}
                    className="text-[11px] font-medium px-1 py-0.5 rounded border-l-2 truncate text-on-surface cursor-pointer hover:opacity-80"
                  >
                    {!e.allDay && <span className="text-text-muted mr-1">{formatTime(e.start)}</span>}
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[11px] text-text-muted pl-1">+{dayEvents.length - 3} mais</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ─────────────────────────────────────────────────────────────────
function WeekView({ date, events, onSlotClick, onEventClick }: {
  date: Date
  events: CalendarEvent[]
  onSlotClick: (d: Date, hour: number) => void
  onEventClick: (e: CalendarEvent) => void
}) {
  const today = new Date()
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const nowH = today.getHours() + today.getMinutes() / 60

  return (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-surface-border sticky top-0 bg-surface-card/90 backdrop-blur-xl z-10">
        <div />
        {days.map(d => (
          <div key={d.toISOString()} className={`py-2 text-center border-l border-surface-border ${isSameDay(d, today) ? 'text-primary' : 'text-text-muted'}`}>
            <div className="text-label-caps">{PT_DAYS[d.getDay()]}</div>
            <div className={`text-lg font-semibold ${isSameDay(d, today) ? 'text-primary' : 'text-on-surface'}`}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      {/* Timeline */}
      <div className="relative">
        {/* Current time line */}
        {isSameDay(days[today.getDay()], today) && (
          <div className="absolute left-[60px] right-0 z-20 flex items-center pointer-events-none" style={{ top: `${nowH * 60}px` }}>
            <div className="w-2 h-2 rounded-full bg-error ml-[-4px]" />
            <div className="flex-1 h-px bg-error" />
          </div>
        )}
        {hours.map(h => (
          <div key={h} className="grid grid-cols-[60px_repeat(7,1fr)] h-[60px]">
            <div className="flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[11px] text-text-muted">{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</span>
            </div>
            {days.map(d => {
              const slotEvents = events.filter(e => {
                if (e.allDay) return false
                const s = new Date(e.start)
                return isSameDay(s, d) && s.getHours() === h
              })
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => onSlotClick(d, h)}
                  className="border-t border-l border-surface-border/50 relative hover:bg-surface-container/20 cursor-pointer"
                >
                  {slotEvents.map(e => {
                    const s = new Date(e.start)
                    const en = new Date(e.end)
                    const duration = Math.max((en.getTime() - s.getTime()) / 60000, 30)
                    const top = (s.getMinutes() / 60) * 60
                    return (
                      <div
                        key={e.id}
                        onClick={ev => { ev.stopPropagation(); onEventClick(e) }}
                        style={{ backgroundColor: `${eventColor(e)}30`, borderLeftColor: eventColor(e), top: `${top}px`, height: `${(duration / 60) * 60}px` }}
                        className="absolute left-0 right-0 border-l-2 px-1 rounded-r overflow-hidden cursor-pointer hover:brightness-125 z-10"
                      >
                        <p className="text-[11px] font-semibold text-on-surface truncate">{e.title}</p>
                        <p className="text-[10px] text-text-muted">{formatTime(e.start)}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────────
function DayView({ date, events, onSlotClick, onEventClick }: {
  date: Date
  events: CalendarEvent[]
  onSlotClick: (d: Date, hour: number) => void
  onEventClick: (e: CalendarEvent) => void
}) {
  const today = new Date()
  const dayEvents = events.filter(e => {
    const s = e.allDay ? new Date(e.start) : new Date(e.start)
    return isSameDay(s, date)
  })
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const nowH = today.getHours() + today.getMinutes() / 60

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 bg-surface-card/90 backdrop-blur-xl border-b border-surface-border px-4 py-3 z-10">
        <p className={`text-headline-md font-bold ${isSameDay(date, today) ? 'text-primary' : 'text-on-surface'}`}>
          {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="text-label-caps text-text-muted">{dayEvents.length} eventos</p>
      </div>
      <div className="relative">
        {isSameDay(date, today) && (
          <div className="absolute left-[60px] right-0 z-20 flex items-center pointer-events-none" style={{ top: `${nowH * 60}px` }}>
            <div className="w-2 h-2 rounded-full bg-error ml-[-4px]" />
            <div className="flex-1 h-px bg-error" />
          </div>
        )}
        {hours.map(h => {
          const slotEvents = dayEvents.filter(e => !e.allDay && new Date(e.start).getHours() === h)
          return (
            <div key={h} className="flex h-[60px]">
              <div className="w-[60px] flex items-start justify-end pr-2 pt-0.5 shrink-0">
                <span className="text-[11px] text-text-muted">{h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}</span>
              </div>
              <div
                onClick={() => onSlotClick(date, h)}
                className="flex-1 border-t border-surface-border/50 relative hover:bg-surface-container/20 cursor-pointer"
              >
                {slotEvents.map(e => {
                  const s = new Date(e.start)
                  const en = new Date(e.end)
                  const duration = Math.max((en.getTime() - s.getTime()) / 60000, 30)
                  return (
                    <div
                      key={e.id}
                      onClick={ev => { ev.stopPropagation(); onEventClick(e) }}
                      style={{ backgroundColor: `${eventColor(e)}25`, borderLeftColor: eventColor(e), top: `${(s.getMinutes() / 60) * 60}px`, height: `${(duration / 60) * 60}px` }}
                      className="absolute left-0 right-0 border-l-2 px-2 py-1 rounded-r cursor-pointer hover:brightness-125 z-10"
                    >
                      <p className="text-body-sm font-semibold text-on-surface">{e.title}</p>
                      <p className="text-label-caps text-text-muted">{formatTime(e.start)} – {formatTime(e.end)}</p>
                      {e.location && <p className="text-label-caps text-text-muted truncate">{e.location}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Agenda View ───────────────────────────────────────────────────────────────
function AgendaView({ events, onEventClick }: {
  events: CalendarEvent[]
  onEventClick: (e: CalendarEvent) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = events
    .filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.start.localeCompare(b.start))

  const grouped: Record<string, CalendarEvent[]> = {}
  filtered.forEach(e => {
    const key = e.allDay ? e.start : new Date(e.start).toISOString().slice(0, 10)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(e)
  })

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-2 bg-surface-container border border-surface-border rounded-lg px-3 py-2">
        <span className="material-symbols-outlined text-text-muted text-lg">search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar eventos..."
          className="flex-1 bg-transparent text-body-sm text-on-surface placeholder-text-muted outline-none"
        />
      </div>
      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-text-muted">
          <span className="material-symbols-outlined text-4xl block mb-2">event_busy</span>
          Nenhum evento encontrado
        </div>
      )}
      {Object.entries(grouped).map(([dateKey, dayEvents]) => {
        const d = new Date(dateKey + 'T12:00:00')
        return (
          <div key={dateKey}>
            <h3 className="text-label-caps text-text-muted font-semibold mb-2 sticky top-0 bg-background py-1">
              {d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <div className="space-y-2">
              {dayEvents.map(e => (
                <div
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  style={{ borderLeftColor: eventColor(e) }}
                  className="flex gap-3 p-3 bg-surface-card border border-surface-border border-l-2 rounded-xl cursor-pointer hover:bg-surface-container transition-colors"
                >
                  <div className="shrink-0 text-right w-14">
                    {e.allDay ? (
                      <span className="text-label-caps text-text-muted">Dia inteiro</span>
                    ) : (
                      <>
                        <p className="text-label-caps text-on-surface font-semibold">{formatTime(e.start)}</p>
                        <p className="text-[11px] text-text-muted">{formatTime(e.end)}</p>
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-on-surface truncate">{e.title}</p>
                    {e.location && <p className="text-label-caps text-text-muted truncate">{e.location}</p>}
                    {e.description && <p className="text-label-caps text-text-muted line-clamp-2 mt-0.5">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ date, events, onDaySelect }: {
  date: Date
  events: CalendarEvent[]
  onDaySelect: (d: Date) => void
}) {
  const [miniDate, setMiniDate] = useState(new Date(date))
  const today = new Date()
  const year = miniDate.getFullYear()
  const month = miniDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function hasEvents(d: number) {
    const day = new Date(year, month, d)
    return events.some(e => isSameDay(new Date(e.allDay ? e.start : e.start), day))
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-label-caps text-on-surface font-semibold">{PT_MONTHS_SHORT[month]} {year}</span>
        <div className="flex gap-1">
          <button onClick={() => setMiniDate(new Date(year, month - 1))} className="p-1 text-text-muted hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button onClick={() => setMiniDate(new Date(year, month + 1))} className="p-1 text-text-muted hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {PT_DAYS.map(d => <div key={d} className="text-center text-[10px] text-text-muted py-0.5">{d[0]}</div>)}
        {cells.map((d, i) => d === null ? (
          <div key={`e-${i}`} />
        ) : (
          <button
            key={d}
            onClick={() => onDaySelect(new Date(year, month, d))}
            className={`w-7 h-7 flex flex-col items-center justify-center rounded-full text-[11px] font-medium transition-colors relative ${isSameDay(new Date(year, month, d), today) ? 'bg-primary-container text-on-primary-container' : 'text-text-muted hover:bg-surface-container-high hover:text-on-surface'}`}
          >
            {d}
            {hasEvents(d) && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const { data: session } = useSession()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<ViewMode>('month')
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [modalDefaults, setModalDefaults] = useState<Partial<GoogleEventInput>>({})
  const [students, setStudents] = useState<{ id: string; name: string; goal: string | null }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const today = new Date()

  // Check Google connection
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/calendar/status')
      .then(r => r.json())
      .then(d => setConnected(d.connected))
      .catch(() => setConnected(false))
  }, [session])

  // Fetch students
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/students')
      .then(r => r.json())
      .then(d => setStudents((d.students || d || []).map((s: any) => ({ id: s.id, name: s.name, goal: s.goal }))))
      .catch(() => {})
  }, [session])

  // Fetch events for current period
  const fetchEvents = useCallback(async () => {
    if (!connected) return
    setLoading(true)
    try {
      let start: Date, end: Date
      if (view === 'month') {
        start = new Date(date.getFullYear(), date.getMonth(), 1)
        end = new Date(date.getFullYear(), date.getMonth() + 2, 0)
      } else if (view === 'week') {
        start = new Date(date)
        start.setDate(date.getDate() - date.getDay())
        end = new Date(start)
        end.setDate(start.getDate() + 6)
      } else if (view === 'day') {
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      } else {
        // Agenda: fetch next 60 days
        start = new Date()
        end = new Date()
        end.setDate(end.getDate() + 60)
      }
      const res = await fetch(`/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`)
      const data = await res.json()
      if (Array.isArray(data)) setEvents(data)
    } finally {
      setLoading(false)
    }
  }, [connected, view, date])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  function navigate(dir: number) {
    const d = new Date(date)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setDate(d)
  }

  function periodLabel() {
    if (view === 'month') return `${PT_MONTHS[date.getMonth()]} ${date.getFullYear()}`
    if (view === 'week') {
      const s = new Date(date); s.setDate(date.getDate() - date.getDay())
      const e = new Date(s); e.setDate(s.getDate() + 6)
      return `${s.getDate()} – ${e.getDate()} de ${PT_MONTHS[s.getMonth()]}`
    }
    if (view === 'day') return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    return 'Próximos eventos'
  }

  function openNewEvent(defaults: Partial<GoogleEventInput> = {}) {
    setEditEvent(null)
    setModalDefaults(defaults)
    setShowModal(true)
  }

  function openEditEvent(e: CalendarEvent) {
    setSelectedEvent(null)
    setEditEvent(e)
    setModalDefaults({
      title: e.title,
      allDay: e.allDay,
      startDateTime: e.allDay ? undefined : e.start,
      endDateTime: e.allDay ? undefined : e.end,
      startDate: e.allDay ? e.start : undefined,
      endDate: e.allDay ? e.end : undefined,
      location: e.location,
      description: e.description,
      colorId: e.colorId,
      attendees: e.attendees,
    })
    setShowModal(true)
  }

  async function saveEvent(data: GoogleEventInput) {
    if (editEvent) {
      await fetch(`/api/calendar/events/${editEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    fetchEvents()
  }

  async function deleteEvent(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' })
    setSelectedEvent(null)
    fetchEvents()
  }

  if (connected === null) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="text-4xl" />
        </div>
      </AppLayout>
    )
  }

  if (!connected) {
    return (
      <AppLayout>
        <NotConnected />
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 bg-surface-card/80 backdrop-blur-xl border-r border-surface-border shrink-0 overflow-y-auto`}>
          <div className="p-4 border-b border-surface-border">
            <Button onClick={() => openNewEvent()} className="w-full gap-2 text-label-caps">
              <span className="material-symbols-outlined text-lg">add</span>
              Novo evento
            </Button>
          </div>
          <MiniCalendar
            date={date}
            events={events}
            onDaySelect={d => { setDate(d); setView('day'); setSidebarOpen(false) }}
          />
          <div className="px-3 pb-4">
            <p className="text-label-caps text-text-muted font-semibold px-3 mb-2">MINHAS AGENDAS</p>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container cursor-pointer">
              <div className="w-3 h-3 rounded-full bg-primary-container" />
              <span className="text-body-sm text-on-surface">Minha agenda</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-surface-card/80 backdrop-blur-xl shrink-0 flex-wrap">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="md:hidden p-2 text-text-muted hover:text-on-surface rounded-lg hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <button
              onClick={() => setDate(today)}
              className="px-3 py-1.5 border border-surface-border rounded-lg text-label-caps text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Hoje
            </button>

            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-1.5 text-text-muted hover:text-on-surface rounded-lg hover:bg-surface-container-high">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => navigate(1)} className="p-1.5 text-text-muted hover:text-on-surface rounded-lg hover:bg-surface-container-high">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <h2 className="text-title-md font-semibold text-on-surface flex-1">{periodLabel()}</h2>

            {loading && <Spinner className="text-primary text-sm" />}

            <button onClick={fetchEvents} className="p-2 text-text-muted hover:text-on-surface rounded-lg hover:bg-surface-container-high" title="Sincronizar">
              <span className="material-symbols-outlined">sync</span>
            </button>

            {/* View selector */}
            <div className="hidden md:flex border border-surface-border rounded-lg overflow-hidden">
              {(['month', 'week', 'day', 'agenda'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-label-caps font-semibold transition-colors ${view === v ? 'bg-primary-container text-on-primary-container' : 'text-text-muted hover:bg-surface-container-high'}`}
                >
                  {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Agenda'}
                </button>
              ))}
            </div>

            {/* Mobile view selector */}
            <select
              value={view}
              onChange={e => setView(e.target.value as ViewMode)}
              className="md:hidden bg-surface-container border border-surface-border rounded-lg px-2 py-1.5 text-label-caps text-on-surface outline-none"
            >
              <option value="agenda">Agenda</option>
              <option value="day">Dia</option>
              <option value="week">Semana</option>
              <option value="month">Mês</option>
            </select>

            <Button onClick={() => openNewEvent()} className="gap-1 text-label-caps hidden md:flex">
              <span className="material-symbols-outlined text-lg">add</span>
              Novo evento
            </Button>
          </header>

          {/* Views */}
          {view === 'month' && (
            <MonthView
              date={date}
              events={events}
              onDayClick={d => { setDate(d); setView('day') }}
              onEventClick={setSelectedEvent}
            />
          )}
          {view === 'week' && (
            <WeekView
              date={date}
              events={events}
              onSlotClick={(d, h) => {
                const dt = new Date(d)
                dt.setHours(h, 0, 0, 0)
                openNewEvent({ startDateTime: dt.toISOString().slice(0, 16) })
              }}
              onEventClick={setSelectedEvent}
            />
          )}
          {view === 'day' && (
            <DayView
              date={date}
              events={events}
              onSlotClick={(d, h) => {
                const dt = new Date(d)
                dt.setHours(h, 0, 0, 0)
                openNewEvent({ startDateTime: dt.toISOString().slice(0, 16) })
              }}
              onEventClick={setSelectedEvent}
            />
          )}
          {view === 'agenda' && (
            <AgendaView events={events} onEventClick={setSelectedEvent} />
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventPopover
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => openEditEvent(selectedEvent)}
          onDelete={() => deleteEvent(selectedEvent.id)}
        />
      )}

      {showModal && (
        <EventModal
          onClose={() => { setShowModal(false); setEditEvent(null) }}
          onSave={saveEvent}
          initial={editEvent ? { ...modalDefaults, id: editEvent.id } : modalDefaults}
          students={students}
        />
      )}
    </AppLayout>
  )
}
