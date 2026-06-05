import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const { setLogs, ...executionData } = body

    const { data, error } = await supabaseAdmin
      .from('WorkoutExecution')
      .update(executionData)
      .eq('id', params.id)
      .select()
      .single()
    if (error) throw error

    if (setLogs && Array.isArray(setLogs) && setLogs.length > 0) {
      const logs = (setLogs as Record<string, unknown>[]).map((log) => ({
        ...log,
        executionId: params.id,
        completedAt: new Date().toISOString(),
      }))
      await supabaseAdmin.from('SetLog').insert(logs)
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
