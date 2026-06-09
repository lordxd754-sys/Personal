import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { title, description, studentId, startAt, endAt, type, status, notes } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório.' }, { status: 400 })
    if (!startAt) return NextResponse.json({ error: 'Data/hora obrigatória.' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('AgendaEvent')
      .update({ title: title.trim(), description, studentId: studentId || null, startAt, endAt: endAt || null, type, status, notes })
      .eq('id', params.id)
      .select('*, student:studentId(id, name)')
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { error } = await supabaseAdmin.from('AgendaEvent').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
