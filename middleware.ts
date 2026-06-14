import { NextResponse, NextRequest } from 'next/server'

const AUTH_ENABLED = process.env.ENABLE_AUTH === 'true'

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isAuthPage = pathname === '/login' || pathname === '/register'

  if (!AUTH_ENABLED && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
