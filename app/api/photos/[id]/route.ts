import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { data: photo } = await supabaseAdmin
      .from('Photo')
      .select('url')
      .eq('id', params.id)
      .single()

    if (photo) {
      const url = photo.url as string
      const pathMatch = url.match(/student-photos\/(.+)$/)
      if (pathMatch) {
        await supabaseAdmin.storage.from('student-photos').remove([pathMatch[1]])
      }
    }

    const { error } = await supabaseAdmin.from('Photo').delete().eq('id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
