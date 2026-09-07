import Link from 'next/link'

const DEMO_ACCOUNTS = [
  { email: 'driver.maya@wrapbid.test', label: 'Maya — driver', hint: 'Short dense-city commute' },
  { email: 'driver.sam@wrapbid.test', label: 'Sam — driver', hint: 'Long suburban commute' },
  { email: 'ads.brightbrew@wrapbid.test', label: 'BrightBrew — advertiser', hint: 'Coffee brand' },
  { email: 'ads.northgear@wrapbid.test', label: 'NorthGear — advertiser', hint: 'Outdoor retailer' },
  { email: 'admin@wrapbid.test', label: 'Ops admin', hint: 'Auctions, verification, economics' },
  { email: 'driver.ali@wrapbid.test', label: 'Ali — Pakistan driver', hint: 'Suzuki Alto · Rawalpindi–Islamabad' },
  { email: 'driver.farid@wrapbid.test', label: 'Farid — Afghanistan driver', hint: 'Toyota Corolla · Kabul' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error, next } = await searchParams

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <div className="card p-6">
        <h1 className="text-xl font-bold">Sign in</h1>

        {error && (
          <p
            className="mt-3 rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            {error}
          </p>
        )}

        <form action="/api/auth/login" method="post" className="mt-4 flex flex-col gap-3">
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input id="password" name="password" type="password" required className="input" />
          </div>
          <button type="submit" className="btn btn-primary mt-1">
            Sign in
          </button>
        </form>

        <p className="mt-4 text-sm muted">
          No account? <Link href="/signup" className="underline">Create one</Link>.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="font-bold">Demo accounts</h2>
        <p className="mt-1 text-sm muted">
          Seeded accounts, all with the password <code>demo1234</code>. These use the normal
          sign-in route — there is no bypass.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <form key={a.email} action="/api/auth/login" method="post">
              <input type="hidden" name="email" value={a.email} />
              <input type="hidden" name="password" value="demo1234" />
              <button
                type="submit"
                className="btn btn-secondary w-full justify-between text-left"
              >
                <span className="font-semibold">{a.label}</span>
                <span className="text-xs muted">{a.hint}</span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  )
}
