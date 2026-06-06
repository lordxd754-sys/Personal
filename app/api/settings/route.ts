import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin.from('Settings').select('*').limit(1)
    if (error) throw error
    return NextResponse.json((data as unknown[])?.[0] || null)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const { data: existing } = await supabaseAdmin.from('Settings').select('id').limit(1)
    let result
    if (existing && existing.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('Settings')
        .update(body)
        .eq('id', (existing[0] as Record<string, unknown>).id as string)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabaseAdmin.from('Settings').insert(body).select().single()
      if (error) throw error
      result = data
    }
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
