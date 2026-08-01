import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { mergeStudentProfileNotes } from '@/lib/student-profile-notes'
import { pick } from '@/lib/sanitize'

const ALLOWED_STUDENT_FIELDS = [
  'name',
  'email',
  'phone',
  'birthdate',
  'age',
  'height',
  'city',
  'state',
  'goal',
  'level',
  'daysPerWeek',
  'sessionDuration',
  'restrictions',
  'equipment',
  'notes',
  'mfitId',
  'status',
] as const

function isMissingAgeHeightColumn(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const err = error as { code?: string; message?: string }
  return err.code === 'PGRST204' && Boolean(err.message?.includes('age') || err.message?.includes('height'))
}

function withoutAgeHeight(payload: Record<string, unknown>) {
  const { age, height, notes, ...rest } = payload
  return {
    ...rest,
    notes: mergeStudentProfileNotes(typeof notes === 'string' ? notes : null, {
      age: age as number | string | null,
      height: height as number | string | null,
    }),
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('Student')
      .select('*')
      .eq('id', params.id)
      .single()
    if (error) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    const allowed = pick(body, [...ALLOWED_STUDENT_FIELDS]) as Record<string, unknown>
    allowed.updatedAt = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('Student')
      .update(allowed)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (!isMissingAgeHeightColumn(error)) return NextResponse.json({ error: 'Erro ao atualizar aluno' }, { status: 500 })
      const fallbackPayload = {
        ...withoutAgeHeight(allowed),
        updatedAt: new Date().toISOString(),
      }
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('Student')
        .update(fallbackPayload)
        .eq('id', params.id)
        .select()
        .single()
      if (fallbackError) return NextResponse.json({ error: 'Erro ao atualizar aluno' }, { status: 500 })
      return NextResponse.json(fallbackData)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { error } = await supabaseAdmin.from('Student').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: 'Erro ao excluir aluno' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
