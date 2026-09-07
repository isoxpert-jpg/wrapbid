import { redirect } from 'next/navigation'
import { Notice } from '@/components/Notice'
import { resolveExpiredAuctions, minimumBidCents } from '@/lib/auction'
import { prisma } from '@/lib/db'
import { formatCents } from '@/lib/pricing'
import { requireRole } from '@/lib/session'
import { MARKETS, marketFromLabel, type MarketCode } from '@/lib/markets'

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ok?:string;error?:string;market?:string}> }) {
  const user = await requireRole('ADVERTISER').catch(() => null)
  if (!user) redirect('/login?next=/advertise')
  await resolveExpiredAuctions()
  const [brand, campaigns, rawListings] = await Promise.all([
    prisma.brand.findUnique({ where: { ownerId: user.id }, include: { products: true } }),
    prisma.campaign.findMany({ where: { advertiserId: user.id }, include: { creatives: true, panelTargets: true } }),
    prisma.panelListing.findMany({ where: { status: 'ACTIVE', vehicle: { verificationStatus: 'VERIFIED' } }, include: { panelType: true, vehicle: { include: { commute: true } }, bids: true }, orderBy: { auctionEndsAt: 'asc' } }),
  ])
  const notice = await searchParams
  const market = (notice.market && notice.market in MARKETS ? notice.market : 'ALL') as MarketCode
  const listings = rawListings.filter(l => market === 'ALL' || marketFromLabel(l.vehicle.commute?.homeLabel ?? '') === market)
  if (!brand) return <div className="mx-auto max-w-xl"><h1 className="text-2xl font-bold">Register your brand</h1><p className="mt-1 text-sm muted">Ops approval is required before bidding.</p><Notice {...notice}/><form className="card mt-5 flex flex-col gap-3 p-6" action="/api/workflow/create-brand" method="post"><label><span className="label">Brand name</span><input className="input" name="name" required/></label><label><span className="label">Industry</span><input className="input" name="industry" required/></label><label><span className="label">Description / featured product</span><textarea className="textarea" name="description" minLength={20} required/></label><label><span className="label">Website</span><input className="input" name="website" type="url"/></label><button className="btn btn-primary">Submit brand</button></form></div>
  return <div className="flex flex-col gap-5"><div><h1 className="text-2xl font-bold">Available panels</h1><p className="text-sm muted">{brand.name} · <span className={`badge ${brand.status==='APPROVED'?'badge-good':'badge-warn'}`}>{brand.status.replaceAll('_',' ')}</span></p></div><Notice {...notice}/><nav className="flex flex-wrap gap-2">{(['ALL','PK','AF','US'] as const).map(code=><a key={code} href={`/advertise?market=${code}`} className={`btn ${market===code?'btn-primary':'btn-secondary'}`}>{MARKETS[code].label}</a>)}</nav>
    {campaigns.length===0 && <div className="card p-5">Create a campaign before bidding. <a className="underline" href="/advertise/campaigns">Campaign setup →</a></div>}
    <div className="grid gap-4 md:grid-cols-2">{listings.map(l => {const listingMarket=marketFromLabel(l.vehicle.commute?.homeLabel??''); return <article className="card overflow-hidden" key={l.id}>{listingMarket!=='US'&&<img src="/budget-hatchback-mockup.png" alt="Illustrative compact car panel preview" className="h-44 w-full object-cover"/>}<div className="p-5"><div className="flex justify-between gap-3"><div><span className="badge badge-neutral">{MARKETS[listingMarket].label}</span><h2 className="mt-2 font-bold">{l.panelType.label}</h2><p className="text-sm muted">{l.vehicle.year} {l.vehicle.make} {l.vehicle.model} · {l.vehicle.color}</p></div><strong>{formatCents(l.currentRentCents)}<span className="block text-xs font-normal muted">/month</span></strong></div><div className="mt-3 flex flex-wrap gap-2"><span className="badge badge-good">Vehicle verified</span><span className="badge badge-neutral">Route {l.vehicle.commute?.routeConfidence?.toLowerCase()??'declared'}</span><span className="badge badge-warn">Installation proof required</span></div><p className="mt-3 text-sm">{l.vehicle.commute?.homeLabel} → {l.vehicle.commute?.workLabel}<br/>~{l.vehicle.commute?.estMonthlyImpressions.toLocaleString()} estimated impressions/month · {l.termMonths} months</p><p className="mt-2 text-xs muted">Ends {l.auctionEndsAt.toLocaleString()} · {l.bids.length} bid(s)</p>
      <a className="btn btn-primary mt-4 w-full" href={`/advertise/listings/${l.id}`}>Open 3D listing</a>
    </div></article>})}</div>{listings.length===0&&<div className="card p-8 text-center muted">No active panels in this market right now.</div>}</div>
}
