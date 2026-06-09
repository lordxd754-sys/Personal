'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

// ─── Types ────────────────────────────────────────────────────────────────────
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
type View = 'dia' | 'semana' | 'mes'

// ─── Constants ────────────────────────────────────────────────────────────────
const HOUR_H = 60            // px per hour in the time grid
const HOURS  = Array.from({ length: 24 }, (_, i) => i)

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const MONTHS_FULL   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MINI_WD       = ['S','T','Q','Q','S','S','D']

const EV_STYLE: Record<string, { bg: string; border: string; text: string; tag: string }> = {
  sessao:      { bg: 'rgba(173,198,255,0.15)', border: '#adc6ff', text: '#adc6ff', tag: 'SESSÃO' },
  avaliacao:   { bg: 'rgba(255,180,171,0.15)', border: '#ffb4ab', text: '#ffb4ab', tag: 'AVALIAÇÃO' },
  compromisso: { bg: 'rgba(255,183,134,0.15)', border: '#ffb786', text: '#ffb786', tag: 'COMPROMISSO' },
  outro:       { bg: 'rgba(140,144,159,0.15)', border: '#8c909f', text: '#8c909f', tag: 'OUTRO' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function pad2(n: number) { return String(n).padStart(2, '0') }
function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
function evTop(ev: AgendaEvent)    { const d = new Date(ev.startAt); return (d.getHours()*60 + d.getMinutes()) * (HOUR_H/60) }
function evHeight(ev: AgendaEvent) {
  if (!ev.endAt) return HOUR_H
  const mins = (new Date(ev.endAt).getTime() - new Date(ev.startAt).getTime()) / 60000
  return Math.max(mins * (HOUR_H/60), 24)
}
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }

// ─── Form defaults ────────────────────────────────────────────────────────────
const EMPTY_FORM = { title:'', description:'', studentId:'', startAt:'', endAt:'', type:'sessao' as AgendaEvent['type'], status:'agendado' as AgendaEvent['status'], notes:'' }

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AgendaPage() {
  const today = new Date()

  const [view,      setView]      = useState<View>('semana')
  const [weekStart, setWeekStart] = useState(() => getMonday(today))
  const [miniMonth, setMiniMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events,    setEvents]    = useState<AgendaEvent[]>([])
  const [students,  setStudents]  = useState<Student[]>([])
  const [loading,   setLoading]   = useState(true)
  const [now,       setNow]       = useState(new Date())

  const [modalOpen,     setModalOpen]     = useState(false)
  const [detailOpen,    setDetailOpen]    = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState('')

  const gridRef = useRef<HTMLDivElement>(null)

  // Tick clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  // Scroll to current time on mount
  useEffect(() => {
    if (gridRef.current) {
      const scrollTo = Math.max(0, (now.getHours() - 1) * HOUR_H)
      gridRef.current.scrollTop = scrollTo
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const viewDays = view === 'dia' ? [weekStart] : weekDays

  // ── Fetch events ──────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    let from: string, to: string
    if (view === 'mes') {
      from = new Date(miniMonth.getFullYear(), miniMonth.getMonth(), 1).toISOString()
      to   = new Date(miniMonth.getFullYear(), miniMonth.getMonth()+1, 0, 23, 59, 59).toISOString()
    } else {
      const first = view === 'dia' ? weekStart : weekStart
      const last  = view === 'dia' ? weekStart : addDays(weekStart, 6)
      from = new Date(first.getFullYear(), first.getMonth(), first.getDate(), 0,0,0).toISOString()
      to   = new Date(last.getFullYear(),  last.getMonth(),  last.getDate(), 23,59,59).toISOString()
    }
    const res = await fetch(`/api/agenda?from=${from}&to=${to}`)
    if (res.ok) setEvents(await res.json())
    setLoading(false)
  }, [view, weekStart, miniMonth])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  useEffect(() => {
    fetch('/api/students?limit=200')
      .then(r => r.ok ? r.json() : [])
      .then(d => setStudents(Array.isArray(d) ? d : d.data ?? []))
  }, [])

  // ── Navigation ────────────────────────────────────────────────────────────
  function prev() {
    if (view === 'mes') setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth()-1, 1))
    else setWeekStart(addDays(weekStart, view === 'dia' ? -1 : -7))
  }
  function next() {
    if (view === 'mes') setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth()+1, 1))
    else setWeekStart(addDays(weekStart, view === 'dia' ? 1 : 7))
  }
  function goToday() { setWeekStart(getMonday(today)); setMiniMonth(new Date(today.getFullYear(), today.getMonth(), 1)) }

  function headerTitle() {
    if (view === 'mes') return `${MONTHS_FULL[miniMonth.getMonth()]} ${miniMonth.getFullYear()}`
    const end = addDays(weekStart, 6)
    if (weekStart.getMonth() === end.getMonth())
      return `${MONTHS_FULL[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    return `${MONTHS_SHORT[weekStart.getMonth()]} – ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`
  }

  // ── Events helpers ────────────────────────────────────────────────────────
  function eventsForDay(date: Date) {
    return events
      .filter(e => isSameDay(new Date(e.startAt), date))
      .sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
  }

  const todayEvs = events
    .filter(e => isSameDay(new Date(e.startAt), today) && e.status !== 'cancelado')
    .sort((a,b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

  const inProgress = todayEvs.filter(e => {
    const s = new Date(e.startAt)
    const en = e.endAt ? new Date(e.endAt) : new Date(s.getTime() + 3600000)
    return s <= now && now <= en
  })
  const upcoming = todayEvs.filter(e => new Date(e.startAt) > now).slice(0, 3)

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openCreate(date?: Date) {
    setSelectedEvent(null)
    if (date) {
      const y = date.getFullYear(), mo = pad2(date.getMonth()+1), da = pad2(date.getDate())
      const h = pad2(date.getHours()), mi = pad2(date.getMinutes())
      const endD = new Date(date.getTime() + 3600000)
      setForm({ ...EMPTY_FORM,
        startAt: `${y}-${mo}-${da}T${h}:${mi}`,
        endAt:   `${endD.getFullYear()}-${pad2(endD.getMonth()+1)}-${pad2(endD.getDate())}T${pad2(endD.getHours())}:${pad2(endD.getMinutes())}`,
      })
    } else { setForm(EMPTY_FORM) }
    setFormError(''); setModalOpen(true)
  }

  function openEdit(ev: AgendaEvent) {
    setSelectedEvent(ev)
    setForm({ title: ev.title, description: ev.description??'', studentId: ev.studentId??'',
      startAt: toDatetimeLocal(ev.startAt), endAt: ev.endAt ? toDatetimeLocal(ev.endAt) : '',
      type: ev.type, status: ev.status, notes: ev.notes??'' })
    setFormError(''); setDetailOpen(false); setModalOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError('Título obrigatório.'); return }
    if (!form.startAt)      { setFormError('Data/hora obrigatória.'); return }
    setSaving(true); setFormError('')
    const payload = { ...form,
      startAt:   new Date(form.startAt).toISOString(),
      endAt:     form.endAt ? new Date(form.endAt).toISOString() : null,
      studentId: form.studentId || null,
    }
    const isEdit = !!selectedEvent
    const res = await fetch(isEdit ? `/api/agenda/${selectedEvent!.id}` : '/api/agenda', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { setModalOpen(false); setSelectedEvent(null); fetchEvents() }
    else { const d = await res.json(); setFormError(d.error ?? 'Erro ao salvar.') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este evento?')) return
    await fetch(`/api/agenda/${id}`, { method: 'DELETE' })
    setDetailOpen(false); setSelectedEvent(null); fetchEvents()
  }

  // ── Mini calendar data ─────────────────────────────────────────────────────
  const miniFirst = new Date(miniMonth.getFullYear(), miniMonth.getMonth(), 1).getDay()
  const miniDays  = new Date(miniMonth.getFullYear(), miniMonth.getMonth()+1, 0).getDate()
  const miniCells: (number|null)[] = []
  for (let i = 0; i < (miniFirst === 0 ? 6 : miniFirst-1); i++) miniCells.push(null)
  for (let d = 1; d <= miniDays; d++) miniCells.push(d)
  while (miniCells.length % 7 !== 0) miniCells.push(null)

  // ── Month view grid ────────────────────────────────────────────────────────
  const mesFirst = new Date(miniMonth.getFullYear(), miniMonth.getMonth(), 1).getDay()
  const mesDays  = new Date(miniMonth.getFullYear(), miniMonth.getMonth()+1, 0).getDate()
  const mesCells: (number|null)[] = []
  for (let i = 0; i < (mesFirst === 0 ? 6 : mesFirst-1); i++) mesCells.push(null)
  for (let d = 1; d <= mesDays; d++) mesCells.push(d)
  while (mesCells.length % 7 !== 0) mesCells.push(null)

  // Current time indicator
  const nowTop = (now.getHours()*60 + now.getMinutes()) * (HOUR_H/60)
  const isCurrentWeek = weekDays.some(d => isSameDay(d, today))

  const dtInputCls = 'w-full px-3 py-2 bg-surface-container-low border border-border-luminous rounded-lg text-on-surface text-body-md focus:outline-none focus:border-primary transition-all'

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* Full-viewport layout: main grid + right panel */}
      <div className="flex overflow-hidden" style={{ height: '100svh' }}>

        {/* ── Left / main calendar ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Header bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-luminous shrink-0 bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-0.5">
              <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined" style={{fontSize:18}}>chevron_left</span>
              </button>
              <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined" style={{fontSize:18}}>chevron_right</span>
              </button>
            </div>
            <span className="font-semibold text-on-surface text-headline-sm min-w-[180px]">{headerTitle()}</span>
            <button onClick={goToday} className="px-3 py-1 rounded border border-border-luminous text-label-caps text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
              Hoje
            </button>
            {/* View toggle */}
            <div className="flex items-center gap-0.5 bg-surface-container-low border border-border-luminous rounded-lg p-0.5 ml-2">
              {(['dia','semana','mes'] as View[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1 rounded text-label-caps transition-colors ${view===v ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  {v === 'mes' ? 'MÊS' : v.toUpperCase()}
                </button>
              ))}
            </div>
            <Button size="sm" className="ml-auto" onClick={() => openCreate()}>
              <span className="material-symbols-outlined" style={{fontSize:16}}>add</span>
              Novo
            </Button>
          </div>

          {/* ── MONTH VIEW ── */}
          {view === 'mes' ? (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-7 border-b border-border-luminous sticky top-0 bg-background z-10">
                {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => (
                  <div key={d} className="py-2 text-center text-label-caps text-on-surface-variant border-l border-border-luminous first:border-l-0">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {mesCells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} className="min-h-[80px] border-b border-r border-border-luminous bg-surface-container-lowest/20" />
                  const date  = new Date(miniMonth.getFullYear(), miniMonth.getMonth(), day)
                  const isT   = isSameDay(date, today)
                  const dayEv = eventsForDay(date)
                  return (
                    <div key={day} onClick={() => openCreate(date)}
                      className="min-h-[80px] border-b border-r border-border-luminous p-1.5 cursor-pointer hover:bg-surface-container/30 transition-colors group">
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-label-caps font-semibold mb-1 ${isT ? 'bg-primary text-on-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>{day}</div>
                      {dayEv.slice(0,3).map(ev => {
                        const s = EV_STYLE[ev.type] ?? EV_STYLE.outro
                        return (
                          <button key={ev.id} onClick={e => { e.stopPropagation(); setSelectedEvent(ev); setDetailOpen(true) }}
                            className="w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate mb-0.5 transition-opacity"
                            style={{ backgroundColor: s.bg, borderLeft:`2px solid ${s.border}`, color: s.text, opacity: ev.status==='cancelado' ? 0.4 : 1 }}>
                            {ev.student?.name ?? ev.title}
                          </button>
                        )
                      })}
                      {dayEv.length > 3 && <span className="text-[10px] text-on-surface-variant pl-1">+{dayEv.length-3}</span>}
                    </div>
                  )
                })}
              </div>
            </div>

          ) : (
            /* ── WEEK / DAY VIEW ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Day header row */}
              <div className="flex border-b border-border-luminous shrink-0 bg-background">
                <div className="w-14 shrink-0" /> {/* time gutter */}
                {viewDays.map((date, i) => {
                  const isT = isSameDay(date, today)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center py-2 border-l border-border-luminous">
                      <span className="text-label-caps text-on-surface-variant">{WEEKDAY_SHORT[date.getDay()]}</span>
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full font-semibold text-body-md mt-0.5 transition-colors ${isT ? 'bg-primary text-on-primary' : 'text-on-surface'}`}>
                        {date.getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Scrollable time grid */}
              <div ref={gridRef} className="flex-1 overflow-y-auto">
                <div className="flex" style={{ minHeight: `${24 * HOUR_H}px` }}>
                  {/* Time labels */}
                  <div className="w-14 shrink-0 relative select-none">
                    {HOURS.map(h => (
                      <div key={h} className="absolute left-0 right-0 flex justify-end pr-2 pointer-events-none"
                        style={{ top: h * HOUR_H - 8 }}>
                        {h > 0 && <span className="text-[10px] text-on-surface-variant font-mono leading-none">{pad2(h)}:00</span>}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {viewDays.map((date, ci) => {
                    const dayEv = eventsForDay(date)
                    const isT   = isSameDay(date, today)
                    return (
                      <div key={ci} className="flex-1 relative border-l border-border-luminous"
                        onClick={e => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                          const y = e.clientY - rect.top + (gridRef.current?.scrollTop ?? 0)
                          const h = Math.floor(y / HOUR_H)
                          const m = Math.floor((y % HOUR_H) / (HOUR_H/4)) * 15
                          const d2 = new Date(date); d2.setHours(Math.min(h, 23), m, 0, 0)
                          openCreate(d2)
                        }}>
                        {/* Hour lines */}
                        {HOURS.map(h => (
                          <div key={h} className="absolute left-0 right-0 border-t border-border-luminous/30" style={{ top: h * HOUR_H }} />
                        ))}
                        {/* Half-hour lines */}
                        {HOURS.map(h => (
                          <div key={`h-${h}`} className="absolute left-0 right-0 border-t border-border-luminous/10" style={{ top: h * HOUR_H + HOUR_H/2 }} />
                        ))}

                        {/* Current time indicator */}
                        {isT && isCurrentWeek && (
                          <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: nowTop }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-1.5 shrink-0 shadow-[0_0_6px_rgba(173,198,255,0.6)]" />
                            <div className="flex-1 h-[1.5px] bg-primary shadow-[0_0_4px_rgba(173,198,255,0.4)]" />
                          </div>
                        )}

                        {/* Events */}
                        {dayEv.map(ev => {
                          const s      = EV_STYLE[ev.type] ?? EV_STYLE.outro
                          const top    = evTop(ev)
                          const height = evHeight(ev)
                          const cancelled = ev.status === 'cancelado'
                          return (
                            <div key={ev.id}
                              className="absolute left-0.5 right-0.5 rounded overflow-hidden cursor-pointer z-10 group"
                              style={{ top, height, backgroundColor: s.bg, borderLeft: `2.5px solid ${s.border}`, opacity: cancelled ? 0.45 : 1 }}
                              onClick={e => { e.stopPropagation(); setSelectedEvent(ev); setDetailOpen(true) }}>
                              <div className="px-1.5 py-1 h-full flex flex-col overflow-hidden">
                                <span className="text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5" style={{ color: s.text }}>{s.tag}</span>
                                <span className="text-[11px] font-semibold text-on-surface leading-tight truncate">
                                  {ev.student?.name ?? ev.title}
                                </span>
                                {height > 48 && (
                                  <span className="text-[10px] font-mono mt-auto" style={{ color: s.text }}>
                                    {fmtTime(ev.startAt)}{ev.endAt ? ` – ${fmtTime(ev.endAt)}` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <div className="w-[200px] shrink-0 border-l border-border-luminous bg-surface-container-lowest flex flex-col overflow-y-auto">

          {/* Mini calendar */}
          <div className="p-3 border-b border-border-luminous">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth()-1, 1))}
                className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined" style={{fontSize:14}}>chevron_left</span>
              </button>
              <span className="text-label-caps font-bold text-on-surface">
                {MONTHS_SHORT[miniMonth.getMonth()].toUpperCase()}
              </span>
              <button onClick={() => setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth()+1, 1))}
                className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined" style={{fontSize:14}}>chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {MINI_WD.map((d,i) => <div key={i} className="text-center text-[9px] font-bold text-on-surface-variant py-0.5">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-0.5">
              {miniCells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const date     = new Date(miniMonth.getFullYear(), miniMonth.getMonth(), day)
                const isT      = isSameDay(date, today)
                const inWeek   = view !== 'mes' && weekDays.some(wd => isSameDay(wd, date))
                return (
                  <button key={day}
                    onClick={() => { setWeekStart(getMonday(date)); if (view === 'mes') setView('semana') }}
                    className={`flex items-center justify-center text-[10px] h-5 w-full rounded-full transition-colors
                      ${isT ? 'bg-primary text-on-primary font-bold' : inWeek ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Próximos compromissos */}
          <div className="p-3 flex-1">
            <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-3">
              Próximos Compromissos
            </h3>
            {loading ? (
              <p className="text-[11px] text-on-surface-variant">Carregando...</p>
            ) : inProgress.length === 0 && upcoming.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant italic">Nenhum evento hoje.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {inProgress.map(ev => {
                  const s = EV_STYLE[ev.type] ?? EV_STYLE.outro
                  return (
                    <div key={ev.id} className="rounded-lg p-2 cursor-pointer border border-border-luminous hover:bg-surface-container transition-colors"
                      style={{ borderLeftColor: s.border, borderLeftWidth: 2 }}
                      onClick={() => { setSelectedEvent(ev); setDetailOpen(true) }}>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-secondary mb-0.5">EM ANDAMENTO</div>
                      <div className="text-[10px] font-mono text-on-surface-variant mb-0.5">
                        {fmtTime(ev.startAt)}{ev.endAt ? ` – ${fmtTime(ev.endAt)}` : ''}
                      </div>
                      <div className="text-[11px] font-semibold text-on-surface truncate">{ev.student?.name ?? ev.title}</div>
                      <div className="text-[10px] text-on-surface-variant truncate">{ev.title}</div>
                    </div>
                  )
                })}
                {upcoming.map(ev => {
                  const s = EV_STYLE[ev.type] ?? EV_STYLE.outro
                  return (
                    <div key={ev.id} className="rounded-lg p-2 cursor-pointer border border-border-luminous hover:bg-surface-container transition-colors"
                      style={{ borderLeftColor: s.border, borderLeftWidth: 2 }}
                      onClick={() => { setSelectedEvent(ev); setDetailOpen(true) }}>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">A SEGUIR</div>
                      <div className="text-[10px] font-mono text-on-surface-variant mb-0.5">
                        {fmtTime(ev.startAt)}{ev.endAt ? ` – ${fmtTime(ev.endAt)}` : ''}
                      </div>
                      <div className="text-[11px] font-semibold text-on-surface truncate">{ev.student?.name ?? ev.title}</div>
                      <div className="text-[10px] text-on-surface-variant truncate">{ev.title}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-border-luminous">
            <h3 className="text-label-caps text-on-surface-variant uppercase tracking-widest mb-2">Legenda</h3>
            {Object.entries(EV_STYLE).map(([type, s]) => (
              <div key={type} className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.border }} />
                <span className="text-[11px] text-on-surface-variant">{s.tag.charAt(0)+s.tag.slice(1).toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Evento" size="sm">
        {selectedEvent && (() => {
          const s = EV_STYLE[selectedEvent.type] ?? EV_STYLE.outro
          return (
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center self-start px-2 py-0.5 rounded-full text-label-caps border"
                style={{ color: s.text, borderColor: s.border, backgroundColor: s.bg }}>
                {s.tag}
              </span>
              <div>
                <h3 className="text-headline-sm font-semibold text-on-surface">{selectedEvent.title}</h3>
                {selectedEvent.description && <p className="text-body-md text-on-surface-variant mt-1">{selectedEvent.description}</p>}
              </div>
              <div className="flex flex-col gap-2 text-body-md text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">schedule</span>
                  <span>{new Date(selectedEvent.startAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}
                    {selectedEvent.endAt && ` → ${fmtTime(selectedEvent.endAt)}`}</span>
                </div>
                {selectedEvent.student && (
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-primary">person</span>
                    <span>{selectedEvent.student.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">flag</span>
                  <span>{selectedEvent.status==='agendado'?'Agendado':selectedEvent.status==='concluido'?'Concluído':'Cancelado'}</span>
                </div>
              </div>
              {selectedEvent.notes && (
                <p className="text-body-md text-on-surface-variant bg-surface-container rounded-lg p-3">{selectedEvent.notes}</p>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => openEdit(selectedEvent)}>
                  <span className="material-symbols-outlined text-[18px]">edit</span> Editar
                </Button>
                <Button variant="danger" onClick={() => handleDelete(selectedEvent.id)}>
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* ── Create / Edit modal ──────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelectedEvent(null) }}
        title={selectedEvent ? 'Editar evento' : 'Novo evento'} size="md">
        <div className="flex flex-col gap-4">
          <Input id="title" label="Título" placeholder="Ex: Treino de força"
            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Início</label>
              <input type="datetime-local" value={form.startAt} onChange={e => setForm(p => ({ ...p, startAt: e.target.value }))} className={dtInputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Fim</label>
              <input type="datetime-local" value={form.endAt} onChange={e => setForm(p => ({ ...p, endAt: e.target.value }))} className={dtInputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select id="type" label="Tipo" value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as AgendaEvent['type'] }))}
              options={[{value:'sessao',label:'Sessão'},{value:'avaliacao',label:'Avaliação'},{value:'compromisso',label:'Compromisso'},{value:'outro',label:'Outro'}]} />
            <Select id="status" label="Status" value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value as AgendaEvent['status'] }))}
              options={[{value:'agendado',label:'Agendado'},{value:'concluido',label:'Concluído'},{value:'cancelado',label:'Cancelado'}]} />
          </div>
          <Select id="student" label="Aluno (opcional)" value={form.studentId}
            onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}
            options={[{value:'',label:'Nenhum'}, ...students.map(s => ({value:s.id,label:s.name}))]} />
          <Textarea id="description" label="Descrição" placeholder="Detalhes do evento..."
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <Textarea id="notes" label="Notas internas" placeholder="Observações privadas..."
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          {formError && <p className="text-error text-body-md">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => { setModalOpen(false); setSelectedEvent(null) }}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {selectedEvent ? 'Salvar' : 'Criar evento'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  )
}
