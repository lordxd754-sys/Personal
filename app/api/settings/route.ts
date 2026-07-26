import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { pick } from '@/lib/sanitize'

const ALLOWED_SETTINGS_FIELDS = [
  'businessName', 'businessPhone', 'businessEmail', 'businessAddress',
  'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom',
  'welcomeMessage', 'theme', 'logo',
] as const

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin.from('Settings').select('*').limit(1)
    if (error) return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 })
    return NextResponse.json((data as unknown[])?.[0] || null)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const allowed = pick(body, [...ALLOWED_SETTINGS_FIELDS])
    allowed.updatedAt = new Date().toISOString()

    const { data: existing } = await supabaseAdmin.from('Settings').select('id').limit(1)
    let result

    if (existing && existing.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('Settings')
        .update(allowed)
        .eq('id', (existing[0] as Record<string, unknown>).id as string)
        .select()
        .single()
      if (error) return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
      result = data
    } else {
      const { data, error } = await supabaseAdmin.from('Settings').insert(allowed).select().single()
      if (error) return NextResponse.json({ error: 'Erro ao criar configurações' }, { status: 500 })
      result = data
    }
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
