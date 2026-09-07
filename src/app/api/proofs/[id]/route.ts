import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/session'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('DRIVER', 'ADMIN')
  const proof = await prisma.installationProof.findUnique({ where: { id: (await params).id }, include: { installation: { include: { agreement: true } } } })
  if (!proof || (user.role !== 'ADMIN' && proof.installation.agreement.driverId !== user.id)) return new Response('Not found', { status: 404 })
  try {
    const body = await readFile(join(process.cwd(), 'storage', 'proofs', proof.photoPath))
    return new Response(body, { headers: { 'Content-Type': proof.mimeType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch { return new Response('Not found', { status: 404 }) }
}
