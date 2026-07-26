import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { pick } from '@/lib/sanitize'

const ALLOWED_EXECUTION_FIELDS = ['completedAt', 'duration', 'notes', 'exercises'] as const
const ALLOWED_SETLOG_FIELDS = ['exerciseIndex', 'setIndex', 'reps', 'weight', 'rpe', 'completed'] as const

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const { setLogs, ...rawBody } = body

    const executionData = pick(rawBody, [...ALLOWED_EXECUTION_FIELDS])
    executionData.updatedAt = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('WorkoutExecution')
      .update(executionData)
      .eq('id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: 'Erro ao atualizar execução' }, { status: 500 })

    if (setLogs && Array.isArray(setLogs) && setLogs.length > 0) {
      const logs = (setLogs as Record<string, unknown>[]).map((log) => ({
        ...pick(log, [...ALLOWED_SETLOG_FIELDS]),
        executionId: params.id,
        completedAt: new Date().toISOString(),
      }))
      await supabaseAdmin.from('SetLog').insert(logs)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
