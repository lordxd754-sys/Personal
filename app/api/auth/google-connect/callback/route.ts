import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !userId) {
    return NextResponse.redirect(new URL('/agenda?error=google_denied', request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google-connect/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/agenda?error=config', request.url))
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/agenda?error=token', request.url))
    }

    const tokens = await tokenRes.json() as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabaseAdmin.from('User').update({
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token ?? null,
      google_token_expiry: expiresAt,
    }).eq('id', userId)

    return NextResponse.redirect(new URL('/agenda?connected=1', request.url))
  } catch {
    return NextResponse.redirect(new URL('/agenda?error=unexpected', request.url))
  }
}
