import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  try {
    let query = supabaseAdmin
      .from('AgendaEvent')
      .select('*, student:studentId(id, name)')
      .order('startAt', { ascending: true })

    if (from) query = query.gte('startAt', from)
    if (to) query = query.lte('startAt', to)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, studentId, startAt, endAt, type, status, notes } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório.' }, { status: 400 })
    if (!startAt) return NextResponse.json({ error: 'Data/hora obrigatória.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('AgendaEvent')
      .insert({ title: title.trim(), description, studentId: studentId || null, startAt, endAt: endAt || null, type, status, notes })
      .select('*, student:studentId(id, name)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
