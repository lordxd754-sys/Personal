import { NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'
import { supabaseAdmin } from '@/lib/supabase'
import { daysSince } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { data, error } = await supabaseAdmin
      .from('Student')
      .select('lastContactAt')
      .eq('status', 'ativo')

    if (error) return NextResponse.json({ error: 'Erro ao buscar acompanhamentos' }, { status: 500 })

    const overdueFollowUp = (data || []).filter((student) => daysSince(student.lastContactAt) > 15).length
    return NextResponse.json(
      { overdueFollowUp },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=90' } }
    )
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
