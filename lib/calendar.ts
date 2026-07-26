import 'server-only'
import { supabaseAdmin } from './supabase'

export interface CalendarEventInput {
  title: string
  description?: string
  location?: string
  startDateTime?: string
  endDateTime?: string
  startDate?: string
  endDate?: string
  allDay?: boolean
  color?: string
}

export interface CalendarEvent {
  id: string
  userId: string
  title: string
  description?: string
  location?: string
  start: string
  end: string
  allDay: boolean
  color?: string
  createdAt: string
  updatedAt: string
}

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

export const NATIVE_COLORS: Record<string, string> = {
  'tomato': '#D50000',
  'flamingo': '#E67C73',
  'tangerine': '#F4511E',
  'banana': '#F6BF26',
  'sage': '#33B679',
  'basil': '#0B8043',
  'peacock': '#039BE5',
  'blueberry': '#3F51B5',
  'lavender': '#7986CB',
  'grape': '#8E24AA',
  'graphite': '#616161',
}
