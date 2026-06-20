import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isSafeRedirectPath } from '@/lib/auth-validation'

const AUTH_ENABLED = process.env.ENABLE_AUTH !== 'false'
const PUBLIC_PATHS = new Set(['/login', '/register'])

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!AUTH_ENABLED) {
    if (PUBLIC_PATHS.has(pathname)) {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
    }
    return withSecurityHeaders(NextResponse.next())
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  })

  const isPublicPath = PUBLIC_PATHS.has(pathname)

  if (isPublicPath && token) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)))
  }

  if (!isPublicPath && !token) {
    const loginUrl = new URL('/login', req.url)
    const callbackUrl = `${pathname}${req.nextUrl.search}`
    if (isSafeRedirectPath(callbackUrl)) {
      loginUrl.searchParams.set('callbackUrl', callbackUrl)
    }
    return withSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  return withSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
