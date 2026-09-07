import type { Metadata } from 'next'

import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { getCurrentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'

import './globals.css'

// Every page reads the session and most pages query Postgres. Render at request
// time so Vercel never tries to contact the production database during builds.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    'Drivers auction individual car panels as ad space, priced by their commute. Advertisers bid a monthly rent.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <html lang="en">
      <body>
        <SiteHeader user={user} />
        <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
        <footer className="no-print mx-auto w-full max-w-6xl px-4 pb-10 pt-4 text-xs muted">
          {APP_NAME} is a prototype. Impression figures are modelled estimates, not
          guarantees, and no real money moves through this app.
        </footer>
      </body>
    </html>
  )
}
