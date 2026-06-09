import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { listCalendars } from '@/lib/google-calendar'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('GoogleToken')
    .select('accessToken, refreshToken')
    .eq('userId', session.user.id)
    .single()

  if (!data) return NextResponse.json({ error: 'Google not connected' }, { status: 403 })

  try {
    const calendars = await listCalendars(data.accessToken, data.refreshToken)
    return NextResponse.json(calendars)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
