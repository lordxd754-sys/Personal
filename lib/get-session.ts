import type { Session } from 'next-auth'

export const AUTH_ENABLED = process.env.ENABLE_AUTH === 'true' && process.env.DISABLE_AUTH !== 'true'

const devSession: Session = {
  user: {
    id: 'dev',
    email: process.env.DEV_USER_EMAIL || 'dev@orquestra.local',
    name: process.env.DEV_USER_NAME || 'Personal Trainer',
  },
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
}

export async function getSession() {
  if (!AUTH_ENABLED) {
    return devSession
  }
  const { auth } = await import('./auth')
  return auth()
}
