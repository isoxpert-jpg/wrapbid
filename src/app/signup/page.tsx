import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>
}) {
  const { error, role } = await searchParams
  const selected = role === 'ADVERTISER' ? 'ADVERTISER' : 'DRIVER'

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="card p-6">
        <h1 className="text-xl font-bold">Create an account</h1>

        {error && (
          <p
            className="mt-3 rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            {error}
          </p>
        )}

        <form action="/api/auth/signup" method="post" className="mt-4 flex flex-col gap-3">
          <fieldset>
            <legend className="label">I want to</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  value: 'DRIVER',
                  title: 'Rent out my car',
                  body: 'List panels and take bids.',
                },
                {
                  value: 'ADVERTISER',
                  title: 'Advertise a product',
                  body: 'Register a brand and bid.',
                },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="card cursor-pointer p-3"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    defaultChecked={selected === opt.value}
                    className="mr-2"
                  />
                  <span className="font-semibold">{opt.title}</span>
                  <span className="mt-1 block text-xs muted">{opt.body}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input id="name" name="name" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="phone">
              Phone <span className="muted font-normal">(optional)</span>
            </label>
            <input id="phone" name="phone" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="input"
            />
            <p className="mt-1 text-xs muted">At least 8 characters.</p>
          </div>

          <button type="submit" className="btn btn-primary mt-1">
            Create account
          </button>
        </form>

        <p className="mt-4 text-sm muted">
          Already registered? <Link href="/login" className="underline">Sign in</Link>.
        </p>
      </div>
    </div>
  )
}
