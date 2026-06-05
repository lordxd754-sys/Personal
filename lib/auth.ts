import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const { data: users, error } = await supabaseAdmin
            .from('User')
            .select('*')
            .eq('email', credentials.email)
            .limit(1)

          if (error || !users || users.length === 0) return null

          const user = users[0]
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

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
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})
