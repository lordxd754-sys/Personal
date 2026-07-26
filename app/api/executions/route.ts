import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { pick } from '@/lib/sanitize'

const ALLOWED_EXECUTION_FIELDS = ['workoutId', 'studentId', 'startedAt', 'completedAt', 'duration', 'notes', 'exercises'] as const

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const allowed = pick(body, [...ALLOWED_EXECUTION_FIELDS])

    if (!allowed.workoutId || !allowed.studentId) {
      return NextResponse.json({ error: 'workoutId e studentId são obrigatórios' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('WorkoutExecution')
      .insert({ ...allowed, startedAt: allowed.startedAt || new Date().toISOString() })
      .select()
      .single()
    if (error) return NextResponse.json({ error: 'Erro ao criar execução' }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
