/**
 * Generates placeholder artwork on the fly, so no binary assets need to be
 * committed to the repo for the seed data to look real. Real uploads are served
 * from /uploads instead.
 *
 * /api/placeholder/<label>/<hex-without-hash>
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ parts: string[] }> },
) {
  const { parts } = await params
  const label = decodeURIComponent(parts[0] ?? 'Artwork')
  const hexPart = (parts[1] ?? '1a56db').replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
  const hex = `#${hexPart.padEnd(6, '0')}`

  // Contrasting text colour, from perceived luminance.
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const fg = luma > 0.6 ? '#101418' : '#ffffff'

  const safe = label.replace(/[<>&]/g, '').slice(0, 40)
  const fontSize = safe.length > 18 ? 44 : 64

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${safe}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${hex}"/>
      <stop offset="100%" stop-color="${hex}" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <circle cx="640" cy="160" r="120" fill="${fg}" opacity="0.10"/>
  <circle cx="150" cy="670" r="170" fill="${fg}" opacity="0.08"/>
  <text x="400" y="420" text-anchor="middle" fill="${fg}"
        font-family="ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700">${safe}</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
