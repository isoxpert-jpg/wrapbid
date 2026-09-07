import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { fieldErrors, signupSchema } from '@/lib/validation'
import type { Role } from '@/lib/constants'

export async function POST(request: Request) {
  const form = await request.formData()
  const parsed = signupSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
    name: form.get('name'),
    role: form.get('role'),
    phone: form.get('phone') ?? '',
  })

  const back = (message: string, role?: string) =>
    NextResponse.redirect(
      new URL(
        `/signup?error=${encodeURIComponent(message)}${role ? `&role=${role}` : ''}`,
        request.url,
      ),
      303,
    )

  if (!parsed.success) {
    return back(
      Object.values(fieldErrors(parsed.error))[0] ?? 'Check your details.',
      String(form.get('role') ?? ''),
    )
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return back('That email is already registered — sign in instead.')

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      role: parsed.data.role,
    },
  })

  const session = await getSession()
  session.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  }
  await session.save()

  // Advertisers register their brand before they can do anything useful.
  const destination = user.role === 'DRIVER' ? '/driver/vehicles/new' : '/advertise/brand'
  return NextResponse.redirect(new URL(destination, request.url), 303)
}
