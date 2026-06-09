import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabaseAdmin
    .from('GoogleToken')
    .select('accessToken, expiresAt')
    .eq('userId', session.user.id)
    .single()

  return NextResponse.json({ connected: !!data?.accessToken })
}
