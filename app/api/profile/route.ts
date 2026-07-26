import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { pick, sanitizeString } from '@/lib/sanitize'
import bcrypt from 'bcryptjs'

const ALLOWED_PROFILE_FIELDS = ['name', 'bio', 'phone', 'instagram', 'youtube', 'avatar_url', 'specialties'] as const

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('id,name,email,bio,phone,instagram,youtube,avatar_url,specialties,createdAt')
      .eq('id', session.user.id)
      .single()
    if (error) return NextResponse.json({ error: 'Erro ao buscar perfil' }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>

    const updateData: Record<string, unknown> = pick(body, [...ALLOWED_PROFILE_FIELDS])

    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (updateData[key] !== undefined) {
        updateData[key] = sanitizeString(updateData[key], 500)
      }
    }

    const password = sanitizeString(body.password, 128)
    if (password && password.length >= 10) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    updateData.updatedAt = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('id', session.user.id)
      .select('id,name,email,bio,phone,instagram,youtube,avatar_url,specialties,createdAt')
      .single()
    if (error) return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
