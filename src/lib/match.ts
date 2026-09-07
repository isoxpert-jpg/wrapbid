/**
 * "Is this actually the right car for my product?"
 *
 * Advertisers need more than a price to choose a vehicle. This produces a 0–100
 * fit score with a visible breakdown — the breakdown matters more than the
 * number, so the UI always renders the reasons rather than just the total.
 */

import { routeOverlapFraction, type LatLng } from './geo'
import { effectiveCpmCents } from './pricing'

export type MatchInput = {
  // listing / vehicle
  home: LatLng
  work: LatLng
  estMonthlyImpressions: number
  monthlyRentCents: number
  panelTypeCode: string
  vehicleYear: number
  /** 1..5, from admin verification. Null when not yet rated. */
  conditionRating: number | null
  isVerified: boolean
  /** Vehicle paint colour as hex, e.g. "#1b1b1b". */
  vehicleColorHex: string | null

  // campaign
  targetCentre: LatLng
  targetRadiusKm: number
  targetPanelCodes: string[]
  /** Remaining budget for the whole term, in cents. */
  remainingBudgetCents: number
  termMonths: number
  /** Dominant colour of the advertiser's artwork, as hex. */
  creativeHex: string | null
}

export type MatchFactor = {
  key: string
  label: string
  /** 0..1 — how well this factor scores. */
  score: number
  /** Contribution to the 0–100 total. */
  weight: number
  /** Plain-language reason shown to the advertiser. */
  detail: string
}

export type MatchResult = {
  total: number
  factors: MatchFactor[]
  /** Hard blockers — reasons this listing is a bad idea regardless of score. */
  warnings: string[]
}

const WEIGHTS = {
  geography: 30,
  panel: 15,
  reach: 20,
  value: 15,
  vehicle: 10,
  contrast: 10,
} as const

export function scoreMatch(input: MatchInput): MatchResult {
  const factors: MatchFactor[] = []
  const warnings: string[] = []

  // --- geography: how much of the commute sits inside the target circle
  const overlap = routeOverlapFraction(
    input.home,
    input.work,
    input.targetCentre,
    input.targetRadiusKm,
  )
  factors.push({
    key: 'geography',
    label: 'Route overlap',
    score: overlap,
    weight: WEIGHTS.geography,
    detail: `${Math.round(overlap * 100)}% of this commute runs inside your target area.`,
  })
  if (overlap === 0) warnings.push('This commute never enters your target area.')

  // --- panel: did the advertiser ask for this panel at all
  const panelMatch = input.targetPanelCodes.includes(input.panelTypeCode)
  factors.push({
    key: 'panel',
    label: 'Panel type',
    score: panelMatch ? 1 : 0.3,
    weight: WEIGHTS.panel,
    detail: panelMatch
      ? 'This panel is one your campaign targets.'
      : 'Not a panel your campaign targets — still buyable, but off-brief.',
  })

  // --- reach: impressions, normalised against a strong 60k/month vehicle
  const reach = Math.min(1, input.estMonthlyImpressions / 60_000)
  factors.push({
    key: 'reach',
    label: 'Estimated reach',
    score: reach,
    weight: WEIGHTS.reach,
    detail: `~${input.estMonthlyImpressions.toLocaleString()} estimated impressions per month.`,
  })

  // --- value: CPM, benchmarked against actual vehicle-wrap rates.
  // Transacted wrap CPMs sit at $1.78 (Wrapify) to $3.50 (Carvertise); broader
  // OOH runs $2–$10. So $1.50 scores 1.0 and $8.00 scores 0. An earlier
  // $8→$40 band was calibrated to digital place-based OOH and rated every
  // realistic listing as excellent value. See docs/market-research.md.
  const CPM_EXCELLENT_CENTS = 150
  const CPM_POOR_CENTS = 800
  const cpm = effectiveCpmCents(input.monthlyRentCents, input.estMonthlyImpressions)
  const value =
    cpm === null
      ? 0
      : clamp01((CPM_POOR_CENTS - cpm) / (CPM_POOR_CENTS - CPM_EXCELLENT_CENTS))
  factors.push({
    key: 'value',
    label: 'Cost efficiency',
    score: value,
    weight: WEIGHTS.value,
    detail:
      cpm === null
        ? 'No impression estimate available.'
        : `Effective CPM of $${(cpm / 100).toFixed(2)} at the current rent.`,
  })

  const totalCost = input.monthlyRentCents * input.termMonths
  if (totalCost > input.remainingBudgetCents) {
    warnings.push(
      `A full ${input.termMonths}-month term here exceeds your remaining campaign budget.`,
    )
  }

  // --- vehicle quality: verification, paint condition, age
  const age = new Date().getFullYear() - input.vehicleYear
  const ageScore = clamp01((15 - age) / 15)
  const conditionScore = input.conditionRating ? input.conditionRating / 5 : 0.5
  const vehicleScore = input.isVerified ? (ageScore + conditionScore) / 2 : 0.2
  factors.push({
    key: 'vehicle',
    label: 'Vehicle quality',
    score: vehicleScore,
    weight: WEIGHTS.vehicle,
    detail: input.isVerified
      ? `${input.vehicleYear} vehicle, paint condition ${input.conditionRating ?? '—'}/5.`
      : 'Vehicle photos are not yet verified by our team.',
  })
  if (!input.isVerified) warnings.push('This vehicle has not passed photo verification yet.')

  // --- contrast: will the artwork actually read against the paint
  const contrast = contrastRatio(input.creativeHex, input.vehicleColorHex)
  const contrastScore = contrast === null ? 0.5 : clamp01((contrast - 1) / 6)
  factors.push({
    key: 'contrast',
    label: 'Colour contrast',
    score: contrastScore,
    weight: WEIGHTS.contrast,
    detail:
      contrast === null
        ? 'Upload artwork to check contrast against this vehicle’s paint.'
        : `Contrast ratio ${contrast.toFixed(1)}:1 against the vehicle’s paint.`,
  })
  if (contrast !== null && contrast < 2) {
    warnings.push('Your artwork is close in tone to this vehicle’s paint — it may not read.')
  }

  const total = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0),
  )

  return { total, factors, warnings }
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** WCAG relative-luminance contrast ratio between two hex colours. */
export function contrastRatio(aHex: string | null, bHex: string | null): number | null {
  const a = luminance(aHex)
  const b = luminance(bHex)
  if (a === null || b === null) return null
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

function luminance(hex: string | null): number | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
}

export function hexToRgb(hex: string | null): { r: number; g: number; b: number } | null {
  if (!hex) return null
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}
