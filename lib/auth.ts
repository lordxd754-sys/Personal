import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'
import { normalizeEmail, isValidEmail } from './auth-validation'

const LOGIN_RATE_LIMIT_WINDOW_MS = 60_000
const LOGIN_RATE_LIMIT_MAX = 10
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function isLoginRateLimited(email: string) {
  const now = Date.now()
  const current = loginAttempts.get(email)

  if (!current || current.resetAt < now) {
    loginAttempts.set(email, { count: 1, resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS })
    return false
  }

  current.count += 1
  loginAttempts.set(email, current)
  return current.count > LOGIN_RATE_LIMIT_MAX
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? normalizeEmail(credentials.email) : ''
        const password = typeof credentials?.password === 'string' ? credentials.password : ''

        if (!email || !password || !isValidEmail(email) || password.length > 128) return null
        if (isLoginRateLimited(email)) return null

        try {
          const { data: users, error } = await supabaseAdmin
            .from('User')
            .select('id,email,name,password')
            .eq('email', email)
            .limit(1)

          if (error || !users || users.length === 0) return null

          const user = users[0] as { id: string; email: string; name: string | null; password: string | null }
          if (!user.password) return null

          const passwordMatch = await bcrypt.compare(password, user.password)

          if (!passwordMatch) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch {
          return null
        }
      },
    }),

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })] : []),
  ],

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token
        token.googleRefreshToken = account.refresh_token
        token.googleTokenExpiry = account.expires_at
        if (token.id) {
          await supabaseAdmin.from('GoogleToken').upsert({
            userId: token.id as string,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at
              ? new Date((account.expires_at as number) * 1000).toISOString()
              : null,
            updatedAt: new Date().toISOString(),
          }, { onConflict: 'userId' })
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      session.googleAccessToken = token.googleAccessToken as string | undefined
      session.googleRefreshToken = token.googleRefreshToken as string | undefined
      session.googleTokenExpiry = token.googleTokenExpiry as number | undefined
      return session
    },
  },
})
