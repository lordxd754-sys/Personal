import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/calendar'

export async function PUT(req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const event = await updateCalendarEvent(session.user.id, params.eventId, body)
    return NextResponse.json(event)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await deleteCalendarEvent(session.user.id, params.eventId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
