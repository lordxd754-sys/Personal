import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    googleAccessToken?: string
    googleRefreshToken?: string
    googleTokenExpiry?: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    googleAccessToken?: string
    googleRefreshToken?: string
    googleTokenExpiry?: number
  }
}
