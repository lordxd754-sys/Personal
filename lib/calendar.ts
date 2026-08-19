import 'server-only'
import { supabaseAdmin } from './supabase'
import type { CalendarEvent, CalendarEventInput } from './calendar-types'

export type { CalendarEvent, CalendarEventInput } from './calendar-types'
export { NATIVE_COLORS } from './calendar-types'

function normalizeEvent(e: any): CalendarEvent {
  const allDay = e.allDay || (!e.startDateTime && e.startDate)
  return {
    id: e.id,
    userId: e.userId,
    title: e.title || '(sem título)',
    description: e.description,
    location: e.location,
    start: allDay ? e.startDate : e.startDateTime,
    end: allDay ? e.endDate : e.endDateTime,
    allDay,
    color: e.color,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }
}

export async function fetchCalendarEvents(
  userId: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const { data, error } = await supabaseAdmin
    .from('CalendarEvent')
    .select('*')
    .eq('userId', userId)
    .or(`startDateTime.gte.${timeMin},startDate.gte.${timeMin.slice(0, 10)}`)
    .or(`endDateTime.lte.${timeMax},endDate.lte.${timeMax.slice(0, 10)}`)
    .order('startDateTime', { ascending: true })

  if (error) throw error
  return (data || []).map(normalizeEvent)
}

export async function createCalendarEvent(
  userId: string,
  event: CalendarEventInput
): Promise<CalendarEvent> {
  const { data, error } = await supabaseAdmin
    .from('CalendarEvent')
    .insert({
      userId,
      title: event.title,
      description: event.description,
      location: event.location,
      startDateTime: event.allDay ? null : event.startDateTime,
      endDateTime: event.allDay ? null : event.endDateTime,
      startDate: event.allDay ? event.startDate : null,
      endDate: event.allDay ? event.endDate : null,
      allDay: event.allDay || false,
      color: event.color,
    })
    .select()
    .single()

  if (error) throw error
  return normalizeEvent(data)
}

function addWeeksToDateInput(value: string | undefined, weeks: number) {
  if (!value) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  date.setDate(date.getDate() + weeks * 7)

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return date.toISOString().slice(0, 10)
  }

  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export async function createCalendarEvents(
  userId: string,
  event: CalendarEventInput
): Promise<CalendarEvent[]> {
  const repeatWeeks = event.repeatWeekly
    ? Math.min(Math.max(Math.floor(Number(event.repeatWeeks) || 12), 1), 52)
    : 1

  if (repeatWeeks === 1) {
    return [await createCalendarEvent(userId, event)]
  }

  const rows = Array.from({ length: repeatWeeks }, (_, index) => ({
    userId,
    title: event.title,
    description: event.description,
    location: event.location,
    startDateTime: event.allDay ? null : addWeeksToDateInput(event.startDateTime, index),
    endDateTime: event.allDay ? null : addWeeksToDateInput(event.endDateTime, index),
    startDate: event.allDay ? addWeeksToDateInput(event.startDate, index) : null,
    endDate: event.allDay ? addWeeksToDateInput(event.endDate, index) : null,
    allDay: event.allDay || false,
    color: event.color,
  }))

  const { data, error } = await supabaseAdmin
    .from('CalendarEvent')
    .insert(rows)
    .select()

  if (error) throw error
  return (data || []).map(normalizeEvent)
}

export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  event: Partial<CalendarEventInput>
): Promise<CalendarEvent> {
  const updateData: any = {}
  if (event.title !== undefined) updateData.title = event.title
  if (event.description !== undefined) updateData.description = event.description
  if (event.location !== undefined) updateData.location = event.location
  if (event.allDay !== undefined) updateData.allDay = event.allDay
  if (event.color !== undefined) updateData.color = event.color

  if (event.allDay) {
    updateData.startDate = event.startDate
    updateData.endDate = event.endDate
    updateData.startDateTime = null
    updateData.endDateTime = null
  } else {
    if (event.startDateTime !== undefined) updateData.startDateTime = event.startDateTime
    if (event.endDateTime !== undefined) updateData.endDateTime = event.endDateTime
    updateData.startDate = null
    updateData.endDate = null
  }

  updateData.updatedAt = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('CalendarEvent')
    .update(updateData)
    .eq('id', eventId)
    .eq('userId', userId)
    .select()
    .single()

  if (error) throw error
  return normalizeEvent(data)
}

export async function deleteCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('CalendarEvent')
    .delete()
    .eq('id', eventId)
    .eq('userId', userId)

  if (error) throw error
}
