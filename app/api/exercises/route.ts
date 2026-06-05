import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const muscleGroup = searchParams.get('muscleGroup')
  const equipment = searchParams.get('equipment')
  const level = searchParams.get('level')
  const type = searchParams.get('type')
  const search = searchParams.get('search')

  try {
    let query = supabaseAdmin.from('Exercise').select('*').order('name', { ascending: true })
    if (muscleGroup && muscleGroup !== 'Todos') query = query.eq('muscleGroup', muscleGroup)
    if (equipment && equipment !== 'Todos') query = query.eq('equipment', equipment)
    if (level && level !== 'Todos') query = query.eq('level', level)
    if (type && type !== 'Todos') query = query.eq('type', type)
    if (search) query = query.ilike('name', `%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('Exercise')
      .insert({ ...body, isCustom: true })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
