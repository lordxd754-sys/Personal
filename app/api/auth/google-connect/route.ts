import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ')

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth não configurado.' }, { status: 500 })
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google-connect/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state: session.user.id,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
