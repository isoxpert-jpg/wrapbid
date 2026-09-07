export function Notice({ ok, error }: { ok?: string; error?: string }) {
  const message = error ?? ok
  if (!message) return null
  return <p className="rounded-lg px-3 py-2 text-sm" style={{
    background: error ? 'var(--danger-soft)' : 'var(--good-soft)',
    color: error ? 'var(--danger)' : 'var(--good)',
  }}>{message}</p>
}
