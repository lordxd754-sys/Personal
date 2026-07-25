import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeStudentIntake, readStudentIntakeRequest } from '@/lib/student-intake'
import { upsertStudentFromIntake } from '@/lib/student-upsert'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')
  const level = searchParams.get('level')
  const orderBy = searchParams.get('orderBy') || 'name'

  try {
    let query = supabaseAdmin.from('Student').select('*')

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
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
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await readStudentIntakeRequest(request)
    const bodyObject = body && typeof body === 'object' && !Array.isArray(body) ? body : { raw: body }
    const contentType = request.headers.get('content-type') || ''
    const hasFormSignals = ['rawRequest', 'pretty', 'submissionID', 'submissionId', 'formID', 'formId'].some(
      (key) => Object.prototype.hasOwnProperty.call(bodyObject, key)
    )
    const shouldNormalize = !contentType.includes('application/json') || hasFormSignals

    if (shouldNormalize) {
      const { student } = await upsertStudentFromIntake(normalizeStudentIntake(bodyObject))
      return NextResponse.json(student, { status: 201 })
    }

    const now = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from('Student')
      .insert({ ...bodyObject, createdAt: now, updatedAt: now })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
