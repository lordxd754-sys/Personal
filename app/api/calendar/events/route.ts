import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { fetchCalendarEvents, createCalendarEvent } from '@/lib/calendar'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

  try {
    const events = await fetchCalendarEvents(session.user.id, start, end)
    return NextResponse.json(events)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const event = await createCalendarEvent(session.user.id, body)
    return NextResponse.json(event)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
