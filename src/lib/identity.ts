import { createHmac } from 'node:crypto'

const secret = process.env.SESSION_SECRET ?? 'dev_only_secret_change_me_at_least_32_chars_long'

export function plateFingerprint(plate: string) {
  const normalized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return createHmac('sha256', secret).update(normalized).digest('hex')
}
