import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: executions } = await supabaseAdmin
      .from('WorkoutExecution')
      .select('id')
      .eq('sessionId', params.id)
      .order('startedAt', { ascending: false })
      .limit(1)

    if (!executions || executions.length === 0) return NextResponse.json({})

    const executionId = (executions[0] as Record<string, unknown>).id as string
    const { data: setLogs } = await supabaseAdmin
      .from('SetLog')
      .select('*')
      .eq('executionId', executionId)
      .order('setNumber', { ascending: false })

    // For each exercise, get the last set
    const result: Record<string, { weight: number; reps: number }> = {}
    for (const log of (setLogs || []) as Array<Record<string, unknown>>) {
      const exerciseId = log.exerciseId as string
      if (!result[exerciseId]) {
        result[exerciseId] = { weight: log.weight as number, reps: log.reps as number }
      }
    }
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
