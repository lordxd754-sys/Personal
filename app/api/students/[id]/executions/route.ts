import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('WorkoutExecution')
      .select('*, Workout(title), WorkoutSession(name)')
      .eq('studentId', params.id)
      .order('startedAt', { ascending: false })
      .limit(20)
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
