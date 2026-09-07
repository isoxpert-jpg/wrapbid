import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { fieldErrors, loginSchema } from '@/lib/validation'
import type { Role } from '@/lib/constants'

const HOME_BY_ROLE: Record<Role, string> = {
  DRIVER: '/driver',
  ADVERTISER: '/advertise',
  ADMIN: '/admin',
}

export async function POST(request: Request) {
  const form = await request.formData()
  const parsed = loginSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  })

  const redirectBack = (message: string) =>
    NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
      303,
    )

  if (!parsed.success) {
    return redirectBack(Object.values(fieldErrors(parsed.error))[0] ?? 'Check your details.')
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  // Compare against a dummy hash when the user is missing so a wrong email and a
  // wrong password take the same time to fail.
  const hash = user?.passwordHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva'
  const ok = await bcrypt.compare(parsed.data.password, hash)

  if (!user || !ok) return redirectBack('Email or password is incorrect.')

  const session = await getSession()
  session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  }
  await session.save()

  const next = form.get('next')
  const destination =
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : HOME_BY_ROLE[user.role as Role]

  return NextResponse.redirect(new URL(destination, request.url), 303)
}
