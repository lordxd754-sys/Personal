import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { fetchCalendarEvents, createCalendarEvent } from '@/lib/google-calendar'

async function getTokens(userId: string) {
  const { data } = await supabaseAdmin
    .from('GoogleToken')
    .select('accessToken, refreshToken')
    .eq('userId', userId)
    .single()
  return data
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 })

  const tokens = await getTokens(session.user.id)
  if (!tokens) return NextResponse.json({ error: 'Google not connected' }, { status: 403 })

  try {
    const events = await fetchCalendarEvents(tokens.accessToken, tokens.refreshToken, start, end)
    return NextResponse.json(events)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokens = await getTokens(session.user.id)
  if (!tokens) return NextResponse.json({ error: 'Google not connected' }, { status: 403 })

  try {
    const body = await req.json()
    const event = await createCalendarEvent(tokens.accessToken, tokens.refreshToken, body)
    return NextResponse.json(event)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
