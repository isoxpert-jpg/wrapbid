import crypto from 'node:crypto'

/**
 * Number plates are PII-adjacent. They are stored for verification and shown in
 * full only to ADMIN; everywhere else — advertiser views, agreements, mockups —
 * they go through this mask.
 */
export function maskPlate(plate: string | null | undefined): string {
  if (!plate) return '—'
  const compact = plate.replace(/\s+/g, '')
  if (compact.length <= 4) return `••• ${compact}`
  return `••• ${compact.slice(-4)}`
}

/** Never store a raw IP. Salted with the session secret so hashes aren't portable. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  const salt = process.env.SESSION_SECRET ?? 'wrapbid-dev-salt'
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}
