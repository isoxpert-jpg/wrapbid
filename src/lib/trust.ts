import { randomInt } from 'node:crypto'
import { prisma } from './db'

export function challengeCode() {
  return `WB-${randomInt(10_000, 100_000)}`
}

export function nextSpotCheckDate(from = new Date()) {
  return new Date(from.getTime() + randomInt(25, 36) * 86_400_000)
}

export async function openVerificationCheck(installationId: string, type: 'INITIAL' | 'SPOT_CHECK') {
  const open = await prisma.verificationCheck.findFirst({ where: { installationId, status: { in: ['OPEN', 'SUBMITTED'] } } })
  if (open) return open
  return prisma.verificationCheck.create({ data: {
    installationId, type, challengeCode: challengeCode(),
    expiresAt: new Date(Date.now() + 24 * 3_600_000),
  } })
}

/** Lazily creates monthly checks; a production scheduler can call the same rule. */
export async function createDueSpotChecks() {
  const due = await prisma.installation.findMany({ where: {
    status: { in: ['INSTALLED', 'VERIFIED'] }, nextCheckAt: { lte: new Date() },
    checks: { none: { status: { in: ['OPEN', 'SUBMITTED'] } } },
  }, select: { id: true } })
  for (const row of due) await openVerificationCheck(row.id, 'SPOT_CHECK')
  return due.length
}
