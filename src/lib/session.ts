import { cookies } from 'next/headers'
import { getIronSession, type SessionOptions } from 'iron-session'

import type { Role } from './constants'

export type SessionUser = {
  id: string
  email: string
  name: string
  role: Role
}

export type AppSession = {
  user?: SessionUser
}

const secret = process.env.SESSION_SECRET
if (secret && secret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters')
}

export const sessionOptions: SessionOptions = {
  password: secret ?? 'dev_only_secret_change_me_at_least_32_chars_long',
  cookieName: 'wrapbid_session',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session.user ?? null
}

/**
 * Authorisation boundary. Middleware gates URL prefixes for UX, but every route
 * handler and server component must call this — middleware alone is not a
 * security boundary.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) throw new UnauthorizedError('You must be signed in.')
  return user
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`This area is limited to: ${roles.join(', ')}.`)
  }
  return user
}

export class UnauthorizedError extends Error {
  status = 401
}

export class ForbiddenError extends Error {
  status = 403
}
