import Link from 'next/link'

import { APP_NAME } from '@/lib/constants'
import type { SessionUser } from '@/lib/session'

const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  DRIVER: [
    { href: '/driver', label: 'My vehicles' },
    { href: '/driver/agreements', label: 'Agreements' },
  ],
  ADVERTISER: [
    { href: '/advertise', label: 'Browse panels' },
    { href: '/advertise/studio', label: 'Studio' },
    { href: '/advertise/campaigns', label: 'Campaigns' },
    { href: '/advertise/agreements', label: 'Agreements' },
  ],
  ADMIN: [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/listings', label: 'Listings' },
    { href: '/admin/verification', label: 'Verification' },
    { href: '/admin/installations', label: 'Fulfilment' },
    { href: '/admin/economics', label: 'Economics' },
  ],
}

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const nav = user ? (NAV_BY_ROLE[user.role] ?? []) : []

  return (
    <header className="no-print sticky top-0 z-20 border-b-4" style={{ background: 'var(--ink)', borderColor: 'var(--brand)', color:'#fffdf6' }}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-base font-black uppercase tracking-wider">
          <span className="plate-mark">W</span>{APP_NAME}
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/studio" className="hover:underline">Preview Studio</Link>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-stone-300 sm:inline">
                {user.name} · <span className="badge badge-neutral">{user.role}</span>
              </span>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="btn btn-secondary">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-secondary">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
