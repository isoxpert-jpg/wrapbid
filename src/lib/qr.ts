import { customAlphabet } from 'nanoid'
import QRCode from 'qrcode'

/** Unambiguous alphabet — no 0/O/1/l — since these end up printed and read aloud. */
const nano = customAlphabet('23456789abcdefghjkmnpqrstuvwxyz', 10)

export function qrSlug(): string {
  return nano()
}

export function qrTargetUrl(slug: string): string {
  const base = process.env.APP_URL ?? 'http://localhost:3000'
  return `${base}/qr/${slug}`
}

/**
 * Renders the QR as an SVG string, server-side. No external QR service, and SVG
 * so it stays sharp at print size.
 */
export async function qrSvg(slug: string): Promise<string> {
  return QRCode.toString(qrTargetUrl(slug), {
    type: 'svg',
    margin: 1,
    // High correction: this ends up on a car, where it will get dirty.
    errorCorrectionLevel: 'H',
  })
}
