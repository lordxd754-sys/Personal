import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('User')
      .select('id,name,email,bio,phone,instagram,youtube,avatar_url,specialties,createdAt')
      .eq('email', session.user.email)
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json() as Record<string, unknown>
    const { password, ...profileData } = body

    const updateData: Record<string, unknown> = { ...profileData }
    if (password && typeof password === 'string' && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const { data, error } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('email', session.user.email)
      .select('id,name,email,bio,phone,instagram,youtube,avatar_url,specialties,createdAt')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
