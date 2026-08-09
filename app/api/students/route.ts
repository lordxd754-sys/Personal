import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeStudentIntake, readStudentIntakeRequest } from '@/lib/student-intake'
import { upsertStudentFromIntake } from '@/lib/student-upsert'
import { mergeStudentProfileNotes } from '@/lib/student-profile-notes'
import { pick, sanitizeSearchQuery } from '@/lib/sanitize'

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

const STUDENT_APP_FIELDS = new Set<string>(ALLOWED_STUDENT_FIELDS)

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

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const level = searchParams.get('level')
  const orderBy = searchParams.get('orderBy') || 'name'
  const view = searchParams.get('view')

  try {
    const fields = view === 'list'
      ? 'id, name, email, phone, goal, level, status, lastContactAt, createdAt'
      : '*'
    let query = supabaseAdmin.from('Student').select(fields)

    if (search) {
      const safeSearch = sanitizeSearchQuery(search)
      query = query.or(`name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`)
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    if (level && level !== 'all') {
      query = query.eq('level', level)
    }

    if (orderBy === 'lastContactAt') {
      query = query.order('lastContactAt', { ascending: true, nullsFirst: true })
    } else if (orderBy === 'createdAt') {
      query = query.order('createdAt', { ascending: false })
    } else {
      query = query.order('name', { ascending: true })
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Erro ao buscar alunos' }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await readStudentIntakeRequest(request)
    const bodyObject = body && typeof body === 'object' && !Array.isArray(body) ? body : { raw: body }
    const contentType = request.headers.get('content-type') || ''
    const hasFormSignals = ['rawRequest', 'pretty', 'submissionID', 'submissionId', 'formID', 'formId'].some(
      (key) => Object.prototype.hasOwnProperty.call(bodyObject, key)
    )
    const hasExternalFields = Object.keys(bodyObject).some((key) => !STUDENT_APP_FIELDS.has(key))
    const shouldNormalize = !contentType.includes('application/json') || hasFormSignals || hasExternalFields

    if (shouldNormalize) {
      const { student } = await upsertStudentFromIntake(normalizeStudentIntake(bodyObject))
      return NextResponse.json(student, { status: 201 })
    }

    const allowed = pick(bodyObject, [...ALLOWED_STUDENT_FIELDS]) as Record<string, unknown>
    const now = new Date().toISOString()

    if (!allowed.name || typeof allowed.name !== 'string' || allowed.name.trim().length < 2) {
      return NextResponse.json({ error: 'Nome do aluno é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('Student')
      .insert({ ...allowed, createdAt: now, updatedAt: now })
      .select()
      .single()

    if (error) {
      if (!isMissingAgeHeightColumn(error)) return NextResponse.json({ error: 'Erro ao criar aluno' }, { status: 500 })
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('Student')
        .insert({ ...withoutAgeHeight(allowed), createdAt: now, updatedAt: now })
        .select()
        .single()
      if (fallbackError) return NextResponse.json({ error: 'Erro ao criar aluno' }, { status: 500 })
      return NextResponse.json(fallbackData, { status: 201 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
