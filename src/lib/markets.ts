export const MARKETS = {
  ALL: { label: 'All markets', currency: 'USD' },
  PK: { label: 'Pakistan', currency: 'PKR' },
  AF: { label: 'Afghanistan', currency: 'AFN' },
  US: { label: 'United States', currency: 'USD' },
} as const

export type MarketCode = keyof typeof MARKETS

export const BUDGET_CARS = [
  { market: 'PK', make: 'Suzuki', model: 'Alto', body: 'Hatchback', note: 'Low running cost; strong city reach' },
  { market: 'PK', make: 'Suzuki', model: 'Mehran', body: 'Hatchback', note: 'Large installed base; simple flat panels' },
  { market: 'PK', make: 'Daihatsu', model: 'Mira', body: 'Hatchback', note: 'Popular imported kei-class option' },
  { market: 'AF', make: 'Toyota', model: 'Corolla', body: 'Sedan', note: 'Common, durable and widely serviceable' },
  { market: 'AF', make: 'Toyota', model: 'Vitz', body: 'Hatchback', note: 'Compact urban vehicle with useful door space' },
  { market: 'AF', make: 'Suzuki', model: 'Alto', body: 'Hatchback', note: 'Affordable compact for dense routes' },
] as const

export function marketFromLabel(label: string): MarketCode {
  if (/Pakistan|Sindh|Punjab|Khyber|Balochistan|Islamabad/i.test(label)) return 'PK'
  if (/Afghanistan|Kabul|Herat|Nangarhar|Kandahar|Balkh/i.test(label)) return 'AF'
  return 'US'
}

/** Affordability-adjusted planning estimates, not live FX quotations. */
export function localPlanningPrice(usdCents: number, market: 'PK' | 'AF') {
  const units = market === 'PK' ? Math.round(usdCents * 0.98) : Math.round(usdCents * 0.18)
  return new Intl.NumberFormat(market === 'PK' ? 'en-PK' : 'fa-AF', {
    style: 'currency', currency: MARKETS[market].currency, maximumFractionDigits: 0,
  }).format(units)
}
