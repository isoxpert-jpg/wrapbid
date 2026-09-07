import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Notice } from '@/components/Notice'
import { prisma } from '@/lib/db'
import { formatCents } from '@/lib/pricing'
import { requireRole } from '@/lib/session'

export default async function DriverPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireRole('DRIVER').catch(() => null)
  if (!user) redirect('/login?next=/driver')
  const [vehicles, panels] = await Promise.all([
    prisma.vehicle.findMany({ where: { driverId: user.id }, include: { commute: true, listings: { include: { panelType: true }, orderBy: { createdAt: 'desc' } } } }),
    prisma.panelType.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])
  const notice = await searchParams
  return <div className="flex flex-col gap-6">
    <div className="flex items-end justify-between gap-3"><div><h1 className="text-2xl font-bold">My vehicles</h1><p className="muted text-sm">Submit a car, get it verified, then auction individual panels.</p></div><Link className="btn btn-primary" href="/driver/vehicles/new">Add vehicle</Link></div>
    <Notice {...notice} />
    {vehicles.map(v => <section className="card p-5" key={v.id}>
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">{v.year} {v.make} {v.model}</h2><p className="text-sm muted">{v.color} · {v.bodyType.replaceAll('_', ' ')}</p></div><span className={`badge ${v.verificationStatus === 'VERIFIED' ? 'badge-good' : 'badge-warn'}`}>{v.verificationStatus.replaceAll('_', ' ')}</span></div>
      {v.commute && <p className="mt-3 text-sm">{v.commute.homeLabel} → {v.commute.workLabel} · ~{v.commute.estMonthlyImpressions.toLocaleString()} estimated impressions/month · {v.commute.exposureScore}× exposure</p>}
      {v.verificationStatus === 'VERIFIED' && <form className="mt-4 grid gap-3 border-t pt-4" style={{borderColor:'var(--line)'}} action="/api/workflow/create-listings" method="post">
        <input type="hidden" name="vehicleId" value={v.id}/><h3 className="font-semibold">Start panel auctions</h3>
        <div className="flex flex-wrap gap-3">{panels.map(p => <label key={p.code} className="text-sm"><input type="checkbox" name="panelTypeCodes" value={p.code}/> {p.label} ({formatCents(Math.round(p.baseRateCents * (v.commute?.exposureScore ?? 1)))})</label>)}</div>
        <div className="grid gap-3 sm:grid-cols-3"><label><span className="label">Term</span><select className="select" name="termMonths"><option value="3">3 months</option><option value="6">6 months</option><option value="12">12 months</option></select></label><label><span className="label">Auction length</span><select className="select" name="auctionHours"><option value="24">1 day</option><option value="72">3 days</option><option value="168">7 days</option></select></label><label><span className="label">Reserve (cents, optional)</span><input className="input" type="number" min="0" name="reserveRentCents"/></label></div>
        <button className="btn btn-primary justify-self-start">List selected panels</button>
      </form>}
      {v.listings.length > 0 && <div className="table-scroll mt-4"><table className="data"><thead><tr><th>Panel</th><th>Status</th><th>Current monthly rent</th><th>Ends</th></tr></thead><tbody>{v.listings.map(l => <tr key={l.id}><td>{l.panelType.label}</td><td>{l.status}</td><td>{formatCents(l.currentRentCents)}</td><td>{l.auctionEndsAt.toLocaleString()}</td></tr>)}</tbody></table></div>}
    </section>)}
    {vehicles.length === 0 && <div className="card p-8 text-center muted">No vehicles yet. Add your first car to begin.</div>}
  </div>
}
