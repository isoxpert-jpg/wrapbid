import Link from 'next/link'
import Image from 'next/image'

import { APP_NAME } from '@/lib/constants'
import { prisma } from '@/lib/db'
import { formatCents } from '@/lib/pricing'
import { BUDGET_CARS, localPlanningPrice } from '@/lib/markets'

export default async function LandingPage() {
  const panels = await prisma.panelType.findMany({ orderBy: { sortOrder: 'asc' } })

  return (
    <div className="flex flex-col gap-14">
      <section className="grid gap-8 border-b-4 pb-10 pt-6 lg:grid-cols-[1fr_460px]" style={{borderColor:'var(--ink)'}}>
        <div><p className="eyebrow">Vehicle media exchange · PK / AF</p><h1 className="mt-3 max-w-4xl text-5xl font-black uppercase leading-[.9] sm:text-7xl">
          Turn the daily drive into street-level media.
        </h1>
        <p className="mt-6 max-w-2xl text-lg muted">
          Drivers list individual body panels — the rear windshield, a door, the tailgate —
          and advertisers bid a monthly rent for each one. Every panel is priced off the
          route you actually drive to work.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup?role=DRIVER" className="btn btn-primary">
            List my car
          </Link>
          <Link href="/advertise" className="btn btn-secondary">
            Browse available panels
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Demo sign-in
          </Link>
          <Link href="/studio" className="btn btn-secondary">
            Try the Studio
          </Link>
        </div></div><aside className="relative overflow-hidden border-l-4 bg-[#f7f1e5]" style={{borderColor:'var(--brand)'}}><Image src="/higgsfield/panel-car.png" alt="Editorial illustration of a compact hatchback with individual advertising panels marked" width={1024} height={1024} className="h-full min-h-80 w-full object-cover" priority/><div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 bg-[#171713]/95 p-4 text-[#fffdf6]">{[['Inventory','By panel'],['Pricing','By commute'],['Settlement','Monthly'],['Tracking','Proof-led']].map(([a,b])=><div key={a} className="border-l border-orange-500 px-3 py-2"><p className="font-mono text-[10px] uppercase tracking-wider text-stone-400">{a}</p><p className="mt-1 text-sm font-black uppercase">{b}</p></div>)}</div></aside>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            step: '1',
            title: 'Tell us your commute',
            body: 'Add your vehicle and normal commute zones. We estimate potential exposure without publishing your exact addresses.',
          },
          {
            step: '2',
            title: 'Receive campaign offers',
            body: 'Qualifying panels appear to advertisers at a transparent starting rent. You choose which panels and terms to offer.',
          },
          {
            step: '3',
            title: 'Install, drive normally, earn',
            body: 'After both sides sign, the decal is produced and installed. Fresh proof unlocks each eligible monthly payout.',
          },
        ].map((c) => (
          <div key={c.step} className="card flex flex-col gap-2 p-5">
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              {c.step}
            </span>
            <h3 className="font-bold">{c.title}</h3>
            <p className="text-sm muted">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="grid overflow-hidden border-y-4 bg-[#171713] text-[#fffdf6] lg:grid-cols-[1fr_1fr_1fr]" style={{borderColor:'var(--ink)'}}>
        {[
          {image:'/higgsfield/route-phone.png',kicker:'01 · Verify',title:'A route, not a home address',body:'Drivers declare commute zones and upload proof. Public listings show useful market coverage while keeping exact addresses private.'},
          {image:'/higgsfield/panel-car.png',kicker:'02 · Auction',title:'Buy the exact panel',body:'A door, rear glass, hood or roof is its own piece of inventory—with its own dimensions, rent and closing clock.'},
          {image:'/higgsfield/campaign-map.png',kicker:'03 · Measure',title:'Plan by local movement',body:'Brands compare panel supply against target areas across Pakistan and Afghanistan before committing monthly budget.'},
        ].map((item)=><article key={item.kicker} className="group border-b border-stone-700 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"><Image src={item.image} alt="" width={1024} height={1024} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"/><div className="p-5"><p className="font-mono text-xs uppercase tracking-widest text-orange-400">{item.kicker}</p><h2 className="mt-2 text-xl font-black uppercase">{item.title}</h2><p className="mt-2 text-sm text-stone-300">{item.body}</p></div></article>)}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Every panel has its own rate</h2>
          <p className="mt-1 text-sm muted">
            Base monthly rent at average exposure. Your actual starting price scales from
            0.25× to 4× depending on how far and where you drive.
          </p>
        </div>

        <div className="card table-scroll">
          <table className="data">
            <thead>
              <tr>
                <th>Panel</th>
                <th>Size</th>
                <th className="text-right">Base rent / month</th>
              </tr>
            </thead>
            <tbody>
              {panels.map((p) => (
                <tr key={p.code}>
                  <td className="font-medium">{p.label}</td>
                  <td className="muted num">
                    {p.widthCm} × {p.heightCm} cm
                  </td>
                  <td className="text-right num font-semibold">
                    {formatCents(p.baseRateCents)}
                  </td>
                </tr>
              ))}
              {panels.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    No panel types seeded yet — run <code>npx prisma db seed</code>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card overflow-hidden p-5">
          <span className="badge badge-brand">Pakistan + Afghanistan</span>
          <h2 className="mt-3 text-2xl font-bold">Built for everyday budget cars</h2>
          <p className="mt-2 text-sm muted">Compact hatchbacks and older sedans are the backbone of local mobility. Wrapbid prices the useful panel—not the prestige of the car.</p>
          <img className="mt-4 w-full rounded-lg" src="/budget-hatchback-mockup.png" alt="Illustrative unbranded compact budget hatchback mockup" />
          <p className="mt-2 text-xs muted">Illustrative mockup. Actual listings should use verified photos of the driver’s vehicle.</p>
        </div>
        <div className="card p-5"><h2 className="text-xl font-bold">Initial vehicle focus</h2><div className="mt-3 flex flex-col gap-3">{BUDGET_CARS.map(c=><div key={`${c.market}-${c.make}-${c.model}`} className="rounded-lg border p-3" style={{borderColor:'var(--line)'}}><div className="flex justify-between"><strong>{c.make} {c.model}</strong><span className="badge badge-neutral">{c.market==='PK'?'Pakistan':'Afghanistan'}</span></div><p className="mt-1 text-sm muted">{c.body} · {c.note}</p></div>)}</div><p className="mt-4 text-xs muted">Planning example for a $45 base panel: about {localPlanningPrice(4500,'PK')} in Pakistan or {localPlanningPrice(4500,'AF')} in Afghanistan. These are affordability-adjusted planning estimates, not live exchange-rate quotations.</p></div>
      </section>

      <section className="card flex flex-col gap-2 p-5">
        <h2 className="font-bold">A note on what this is</h2>
        <p className="text-sm muted">
          {APP_NAME} is a working prototype. Impression counts are modelled from commute
          distance and area density — they are estimates, not measured audience figures. No
          real payments are processed, and the rent agreement it generates is a specimen
          template that a lawyer should review before anyone relies on it.
        </p>
      </section>
    </div>
  )
}
