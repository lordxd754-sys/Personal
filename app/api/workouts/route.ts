import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  try {
    let query = supabaseAdmin
      .from('Workout')
      .select('id, title, status, createdAt, studentId, Student(id, name), WorkoutSession(id, name, WorkoutExercise(id, name))')
      .order('createdAt', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Erro ao buscar treinos' }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
