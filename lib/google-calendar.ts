import 'server-only'
import { google } from 'googleapis'
import { GOOGLE_COLORS } from './calendar-colors'

export interface GoogleEventInput {
  title: string
  description?: string
  location?: string
  startDateTime?: string
  endDateTime?: string
  startDate?: string
  endDate?: string
  allDay?: boolean
  colorId?: string
  attendees?: string[]
  reminderMinutes?: number
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  location?: string
  start: string
  end: string
  allDay: boolean
  colorId?: string
  color?: string
  calendarId?: string
  htmlLink?: string
  attendees?: string[]
}

export { GOOGLE_COLORS } from './calendar-colors'

function getClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

function normalizeEvent(e: any): CalendarEvent {
  const allDay = !e.start?.dateTime
  return {
    id: e.id,
    title: e.summary || '(sem título)',
    description: e.description,
    location: e.location,
    start: allDay ? e.start?.date : e.start?.dateTime,
    end: allDay ? e.end?.date : e.end?.dateTime,
    allDay,
    colorId: e.colorId,
    color: e.colorId ? GOOGLE_COLORS[e.colorId] : undefined,
    htmlLink: e.htmlLink,
    attendees: e.attendees?.map((a: any) => a.email) ?? [],
  }
}

export async function fetchCalendarEvents(
  accessToken: string,
  refreshToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const calendar = getClient(accessToken, refreshToken)
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })
  return (res.data.items || []).map(normalizeEvent)
}

export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string,
  event: GoogleEventInput
): Promise<CalendarEvent> {
  const calendar = getClient(accessToken, refreshToken)
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: event.allDay
        ? { date: event.startDate }
        : { dateTime: event.startDateTime, timeZone: 'America/Sao_Paulo' },
      end: event.allDay
        ? { date: event.endDate }
        : { dateTime: event.endDateTime, timeZone: 'America/Sao_Paulo' },
      colorId: event.colorId,
      attendees: event.attendees?.map(email => ({ email })),
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: event.reminderMinutes ?? 30 }],
      },
    },
  })
  return normalizeEvent(res.data)
}

export async function updateCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string,
  event: Partial<GoogleEventInput>
): Promise<CalendarEvent> {
  const calendar = getClient(accessToken, refreshToken)
  const res = await calendar.events.patch({
    calendarId: 'primary',
    eventId,
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      ...(event.startDateTime && {
        start: { dateTime: event.startDateTime, timeZone: 'America/Sao_Paulo' },
      }),
      ...(event.endDateTime && {
        end: { dateTime: event.endDateTime, timeZone: 'America/Sao_Paulo' },
      }),
      ...(event.colorId !== undefined && { colorId: event.colorId }),
    },
  })
  return normalizeEvent(res.data)
}

export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string,
  eventId: string
): Promise<void> {
  const calendar = getClient(accessToken, refreshToken)
  await calendar.events.delete({ calendarId: 'primary', eventId })
}

export async function listCalendars(accessToken: string, refreshToken: string) {
  const calendar = getClient(accessToken, refreshToken)
  const res = await calendar.calendarList.list()
  return res.data.items || []
}
