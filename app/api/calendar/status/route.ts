import { NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  return NextResponse.json({ connected: true })
}
