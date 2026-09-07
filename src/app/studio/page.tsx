import Link from 'next/link'
import { PublicStudio } from '@/components/PublicStudio'
import { getCurrentUser } from '@/lib/session'

export default async function PublicStudioPage(){
  const user=await getCurrentUser()
  return <div className="flex flex-col gap-6"><div className="max-w-3xl"><span className="badge badge-brand">No account required</span><h1 className="mt-3 text-3xl font-bold">See your idea on the car</h1><p className="mt-2 muted">Drivers can explore the panels they might list. Brand prospects can test artwork before committing to a campaign. Public artwork previews stay on this device.</p></div><PublicStudio/><div className="card flex flex-wrap items-center justify-between gap-3 p-5"><div><h2 className="font-bold">Ready to continue?</h2><p className="text-sm muted">Create an account to save creatives, build campaigns, or list your vehicle.</p></div>{user?.role==='ADVERTISER'?<Link className="btn btn-primary" href="/advertise/studio">Open campaign Studio</Link>:user?.role==='DRIVER'?<Link className="btn btn-primary" href="/driver">List my panels</Link>:<div className="flex gap-2"><Link className="btn btn-secondary" href="/signup?role=DRIVER">Join as driver</Link><Link className="btn btn-primary" href="/signup?role=ADVERTISER">Join as brand</Link></div>}</div></div>
}
