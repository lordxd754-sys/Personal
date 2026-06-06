import { auth } from './auth'

export async function getSession() {
  if (process.env.DISABLE_AUTH === 'true') {
    return { user: { id: 'dev', email: process.env.DEV_USER_EMAIL || 'dev@dev.com', name: 'Dev' } } as any
  }
  return auth()
}
