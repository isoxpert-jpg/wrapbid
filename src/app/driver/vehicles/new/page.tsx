import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { MAX_VEHICLE_AGE_YEARS } from '@/lib/constants'

export default async function NewVehiclePage() {
  const user = await requireRole('DRIVER').catch(() => null)
  if (!user) redirect('/login?next=/driver/vehicles/new')
  const cities = await prisma.city.findMany({ orderBy: [{ name: 'asc' }] })
  return <div className="mx-auto max-w-2xl"><h1 className="text-2xl font-bold">Qualify your vehicle</h1><p className="mt-1 text-sm muted">Complete a few steps to receive campaign offers near your normal route. We use public zones here—not your exact home address.</p>
    <section className="card mt-5 p-5"><h2 className="font-bold">Driver and vehicle eligibility</h2><ul className="mt-2 list-disc space-y-1 pl-5 text-sm muted"><li>You are at least 18 and legally allowed to drive this vehicle.</li><li>The vehicle is no more than {MAX_VEHICLE_AGE_YEARS} years old.</li><li>The vehicle has valid registration and any locally required insurance or permits.</li><li>The selected advertising panels have no major rust, body damage, or unsafe repairs.</li><li>You will drive normally; Wrapbid does not require extra trips or continuous GPS.</li><li>You agree to fresh installation proof and occasional spot-checks before monthly payout.</li></ul><p className="mt-3 text-xs muted">Age eligibility does not guarantee approval. Operations also reviews roadworthiness and usable panel condition.</p></section>
    <form action="/api/workflow/create-vehicle" method="post" className="card mt-5 grid gap-4 p-6 sm:grid-cols-2">
      {['make','model','color','plateNumber'].map(n => <label key={n}><span className="label">{n === 'plateNumber' ? 'Plate number' : n[0].toUpperCase()+n.slice(1)}</span><input className="input" name={n} required/></label>)}
      <label><span className="label">Year</span><input className="input" name="year" type="number" min={new Date().getFullYear()-MAX_VEHICLE_AGE_YEARS} max={new Date().getFullYear()+1} required/><span className="mt-1 block text-xs muted">{new Date().getFullYear()-MAX_VEHICLE_AGE_YEARS} or newer</span></label>
      <label><span className="label">Body type</span><select className="select" name="bodyType">{['SEDAN','SUV','HATCHBACK','PICKUP','VAN'].map(x=><option key={x}>{x}</option>)}</select></label>
      <City label="Home city" prefix="home" cities={cities}/><City label="Work city" prefix="work" cities={cities}/>
      <label><span className="label">Commute days/week</span><input className="input" type="number" name="commuteDaysPerWeek" defaultValue="5" min="1" max="7"/></label>
      <label><span className="label">Area type</span><select className="select" name="areaType">{['URBAN_CORE','URBAN','SUBURBAN','RURAL'].map(x=><option key={x}>{x.replaceAll('_',' ')}</option>)}</select></label>
      <label><span className="label">Parking</span><select className="select" name="parkingType">{['STREET_BUSY','LOT','GARAGE'].map(x=><option key={x}>{x.replaceAll('_',' ')}</option>)}</select></label>
      <label className="sm:col-span-2 flex items-start gap-2 rounded-lg p-3 text-sm" style={{background:'var(--brand-soft)'}}><input className="mt-1" type="checkbox" name="acceptedEligibility" value="true" required/><span>I confirm the eligibility statements above and understand that approval, campaign availability, and earnings are not guaranteed.</span></label><button className="btn btn-primary sm:col-span-2">Submit for verification</button>
    </form></div>
}

function City({ label, prefix, cities }: { label:string; prefix:string; cities:{name:string;region:string;lat:number;lng:number}[] }) {
  return <label><span className="label">{label}</span><select className="select" name={`${prefix}Choice`} required>{cities.map(c => <option key={`${c.name}-${c.region}`} value={`${c.name}, ${c.region}|${c.lat}|${c.lng}`}>{c.name}, {c.region}</option>)}</select></label>
}
