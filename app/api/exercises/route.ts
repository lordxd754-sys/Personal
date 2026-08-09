import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { pick, sanitizeString, sanitizeSearchQuery } from '@/lib/sanitize'

const ALLOWED_EXERCISE_FIELDS = ['name', 'muscleGroup', 'equipment', 'level', 'type', 'description', 'videoUrl', 'imageUrl'] as const

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const muscleGroup = searchParams.get('muscleGroup')
  const equipment = searchParams.get('equipment')
  const level = searchParams.get('level')
  const type = searchParams.get('type')
  const search = searchParams.get('search')
  const view = searchParams.get('view')

  try {
    const fields = view === 'list'
      ? 'id, name, muscleGroup, equipment, level, type, isCustom'
      : '*'
    let query = supabaseAdmin.from('Exercise').select(fields).order('name', { ascending: true })
    if (muscleGroup && muscleGroup !== 'Todos') query = query.eq('muscleGroup', muscleGroup)
    if (equipment && equipment !== 'Todos') query = query.eq('equipment', equipment)
    if (level && level !== 'Todos') query = query.eq('level', level)
    if (type && type !== 'Todos') query = query.eq('type', type)
    if (search) query = query.ilike('name', `%${sanitizeSearchQuery(search)}%`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Erro ao buscar exercícios' }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json()
    const allowed = pick(body, [...ALLOWED_EXERCISE_FIELDS])

    if (!allowed.name || typeof allowed.name !== 'string' || allowed.name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome do exercício é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('Exercise')
      .insert({ ...allowed, isCustom: true })
      .select()
      .single()
    if (error) return NextResponse.json({ error: 'Erro ao criar exercício' }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
