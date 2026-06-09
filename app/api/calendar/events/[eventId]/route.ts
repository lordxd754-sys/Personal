import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar'

async function getTokens(userId: string) {
  const { data } = await supabaseAdmin
    .from('GoogleToken')
    .select('accessToken, refreshToken')
    .eq('userId', userId)
    .single()
  return data
}

export async function PUT(req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokens = await getTokens(session.user.id)
  if (!tokens) return NextResponse.json({ error: 'Google not connected' }, { status: 403 })

  try {
    const body = await req.json()
    const event = await updateCalendarEvent(tokens.accessToken, tokens.refreshToken, params.eventId, body)
    return NextResponse.json(event)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { eventId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokens = await getTokens(session.user.id)
  if (!tokens) return NextResponse.json({ error: 'Google not connected' }, { status: 403 })

  try {
    await deleteCalendarEvent(tokens.accessToken, tokens.refreshToken, params.eventId)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
