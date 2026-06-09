import 'server-only'
import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || !userId) {
    return NextResponse.redirect(new URL('/agenda?error=google_connect_failed', req.url))
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google-connect/callback`

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const { tokens } = await oauth2Client.getToken(code)

    await supabaseAdmin.from('GoogleToken').upsert(
      {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'userId' }
    )

    return NextResponse.redirect(new URL('/agenda?connected=1', req.url))
  } catch {
    return NextResponse.redirect(new URL('/agenda?error=google_connect_failed', req.url))
  }
}
