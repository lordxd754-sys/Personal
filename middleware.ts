import { auth } from '@/lib/auth'
import { NextResponse, NextRequest } from 'next/server'

const DISABLE_AUTH = process.env.DISABLE_AUTH === 'true'

export default DISABLE_AUTH
  ? function middleware(req: NextRequest) {
      const p = req.nextUrl.pathname
      if (p === '/login' || p === '/register') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
  : auth(function middleware(req) {
      const isLoggedIn = !!req.auth
      const pathname = req.nextUrl.pathname
      const isAuthPage = pathname === '/login' || pathname === '/register'

      if (!isLoggedIn && !isAuthPage) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    })

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
