import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data, error } = await supabaseAdmin
      .from('Photo')
      .select('*')
      .eq('studentId', params.id)
      .order('takenAt', { ascending: false })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const angle = formData.get('angle') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const fileName = `${params.id}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('student-photos')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) throw uploadError

    const { data: urlData } = supabaseAdmin.storage
      .from('student-photos')
      .getPublicUrl(fileName)

    const { data, error } = await supabaseAdmin
      .from('Photo')
      .insert({ studentId: params.id, url: urlData.publicUrl, angle, takenAt: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
