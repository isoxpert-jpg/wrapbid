import { describe, expect, it } from 'vitest'

import { EXPOSURE_MAX, EXPOSURE_MIN } from './constants'
import { breakEvenMonthlyRentCents, computeCosts } from './costs'
import { haversineKm, routeOverlapFraction } from './geo'
import { contrastRatio } from './match'
import { computeExposure, effectiveCpmCents, printResolution, startingRentCents } from './pricing'

const AUSTIN = { lat: 30.2672, lng: -97.7431 }
const ROUND_ROCK = { lat: 30.5083, lng: -97.6789 }

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm(AUSTIN, AUSTIN)).toBe(0)
  })

  it('matches a known distance within 1km', () => {
    // Austin → Round Rock is ~27km straight line
    expect(haversineKm(AUSTIN, ROUND_ROCK)).toBeGreaterThan(26)
    expect(haversineKm(AUSTIN, ROUND_ROCK)).toBeLessThan(29)
  })

  it('is symmetric', () => {
    expect(haversineKm(AUSTIN, ROUND_ROCK)).toBeCloseTo(haversineKm(ROUND_ROCK, AUSTIN), 6)
  })
})

describe('computeExposure', () => {
  const base = {
    home: AUSTIN,
    work: ROUND_ROCK,
    commuteDaysPerWeek: 5,
    areaType: 'SUBURBAN' as const,
    parkingType: 'LOT' as const,
  }

  it('produces a round-trip distance twice the road distance', () => {
    const r = computeExposure(base)
    expect(r.dailyKm).toBeCloseTo(r.roadKm * 2, 1)
  })

  it('scales impressions up in denser areas', () => {
    const suburban = computeExposure(base)
    const urban = computeExposure({ ...base, areaType: 'URBAN_CORE' })
    expect(urban.estMonthlyImpressions).toBeGreaterThan(suburban.estMonthlyImpressions)
  })

  it('scales impressions down for a rural commute', () => {
    const suburban = computeExposure(base)
    const rural = computeExposure({ ...base, areaType: 'RURAL' })
    expect(rural.estMonthlyImpressions).toBeLessThan(suburban.estMonthlyImpressions)
  })

  it('clamps exposure for an absurdly long commute', () => {
    const r = computeExposure({
      ...base,
      work: { lat: 40.7128, lng: -74.006 }, // Austin → New York
      areaType: 'URBAN_CORE',
    })
    expect(r.exposureScore).toBeLessThanOrEqual(EXPOSURE_MAX)
  })

  it('clamps exposure for a near-zero commute', () => {
    const r = computeExposure({
      ...base,
      work: { lat: AUSTIN.lat + 0.0005, lng: AUSTIN.lng },
      areaType: 'RURAL',
    })
    expect(r.exposureScore).toBeGreaterThanOrEqual(EXPOSURE_MIN)
  })

  it('calibration: a typical commuter scores near 1.0', () => {
    // 14km each way straight-line, 5 days, suburban, lot parking. If this drifts
    // far from 1.0, REFERENCE_IMPRESSIONS and IMPRESSIONS_PER_KM are out of step
    // and the whole rate card is mis-scaled.
    const r = computeExposure({
      home: { lat: 30.2672, lng: -97.7431 },
      work: { lat: 30.2672 + 14 / 111, lng: -97.7431 },
      commuteDaysPerWeek: 5,
      areaType: 'SUBURBAN',
      parkingType: 'LOT',
    })
    expect(r.exposureScore).toBeGreaterThan(0.8)
    expect(r.exposureScore).toBeLessThan(1.25)
  })

  it('calibration: realistic commutes keep dynamic range and do not all clamp', () => {
    // Regression guard: an earlier REFERENCE_IMPRESSIONS pinned every real
    // commute to EXPOSURE_MAX, flattening urban/rural differentiation entirely.
    const shortCityHop = computeExposure({
      home: { lat: 42.3736, lng: -71.1097 }, // Cambridge
      work: { lat: 42.3601, lng: -71.0589 }, // Boston
      commuteDaysPerWeek: 5,
      areaType: 'URBAN_CORE',
      parkingType: 'STREET_BUSY',
    })
    const longHaul = computeExposure({
      home: { lat: 40.015, lng: -105.2705 }, // Boulder
      work: { lat: 39.7392, lng: -104.9903 }, // Denver
      commuteDaysPerWeek: 4,
      areaType: 'SUBURBAN',
      parkingType: 'GARAGE',
    })

    expect(shortCityHop.exposureScore).toBeLessThan(1)
    expect(longHaul.exposureScore).toBeGreaterThan(shortCityHop.exposureScore * 2)
    // Neither may sit on a clamp boundary, or the model has lost its range.
    expect(longHaul.exposureScore).toBeLessThan(EXPOSURE_MAX)
    expect(shortCityHop.exposureScore).toBeGreaterThan(EXPOSURE_MIN)
  })

  it('scales with days driven per week', () => {
    const two = computeExposure({ ...base, commuteDaysPerWeek: 2 })
    const five = computeExposure({ ...base, commuteDaysPerWeek: 5 })
    expect(five.estMonthlyImpressions).toBeGreaterThan(two.estMonthlyImpressions)
  })
})

describe('startingRentCents', () => {
  it('scales the base rate by exposure', () => {
    expect(startingRentCents(9000, 2)).toBe(18000)
  })

  it('never falls below the rent floor', () => {
    expect(startingRentCents(2500, 0.25)).toBe(1500)
  })

  it('keeps panel ordering intact — a rear windshield always beats a roof', () => {
    const exposure = 1.2
    expect(startingRentCents(9000, exposure)).toBeGreaterThan(startingRentCents(2500, exposure))
  })
})

describe('effectiveCpmCents', () => {
  it('computes cost per thousand impressions', () => {
    // $50/month over 25,000 impressions = $2.00 CPM
    expect(effectiveCpmCents(5000, 25_000)).toBe(200)
  })

  it('returns null rather than Infinity with no impressions', () => {
    expect(effectiveCpmCents(5000, 0)).toBeNull()
  })
})

describe('printResolution', () => {
  it('flags artwork that is too small for a 120cm panel', () => {
    const r = printResolution(600, 120)
    expect(r.ok).toBe(false)
    expect(r.recommendedWidthPx).toBeGreaterThan(600)
  })

  it('passes artwork with enough pixels', () => {
    const r = printResolution(6000, 120)
    expect(r.ok).toBe(true)
  })
})

describe('routeOverlapFraction', () => {
  it('is 1 when the whole commute sits inside the circle', () => {
    expect(routeOverlapFraction(AUSTIN, ROUND_ROCK, AUSTIN, 100)).toBe(1)
  })

  it('is 0 when the commute is far outside the circle', () => {
    const paris = { lat: 48.8566, lng: 2.3522 }
    expect(routeOverlapFraction(AUSTIN, ROUND_ROCK, paris, 10)).toBe(0)
  })

  it('is partial when the circle covers only one end', () => {
    const f = routeOverlapFraction(AUSTIN, ROUND_ROCK, AUSTIN, 5)
    expect(f).toBeGreaterThan(0)
    expect(f).toBeLessThan(1)
  })
})

describe('computeCosts', () => {
  const panel = { panelWidthCm: 120, panelHeightCm: 45 }

  it('leaves a positive margin on a healthy deal', () => {
    const c = computeCosts({ monthlyRentCents: 9000, termMonths: 6, ...panel })
    expect(c.totalValueCents).toBe(54000)
    expect(c.platformMarginCents).toBeGreaterThan(0)
    expect(c.isUnprofitable).toBe(false)
  })

  it('flags a deal that loses money on print cost', () => {
    // A big roof panel at the rent floor for a single month.
    const c = computeCosts({
      monthlyRentCents: 1500,
      termMonths: 1,
      panelWidthCm: 100,
      panelHeightCm: 80,
    })
    expect(c.isUnprofitable).toBe(true)
    expect(c.platformMarginCents).toBeLessThanOrEqual(0)
  })

  it('balances: total = payout + print + shipping + processing + margin', () => {
    const c = computeCosts({ monthlyRentCents: 7000, termMonths: 3, ...panel })
    const sum =
      c.driverPayoutCents +
      c.printCostCents +
      c.shippingCostCents +
      c.processingFeeCents +
      c.platformMarginCents
    expect(sum).toBe(c.totalValueCents)
  })
})

describe('breakEvenMonthlyRentCents', () => {
  it('returns a rent that actually breaks even', () => {
    const rent = breakEvenMonthlyRentCents(3, 100, 80)
    const c = computeCosts({
      monthlyRentCents: rent,
      termMonths: 3,
      panelWidthCm: 100,
      panelHeightCm: 80,
    })
    expect(c.platformMarginCents).toBeGreaterThanOrEqual(0)
  })

  it('requires less monthly rent over a longer term', () => {
    expect(breakEvenMonthlyRentCents(12, 120, 45)).toBeLessThan(
      breakEvenMonthlyRentCents(3, 120, 45),
    )
  })
})

describe('contrastRatio', () => {
  it('is 21:1 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('is 1:1 for identical colours', () => {
    expect(contrastRatio('#3366cc', '#3366cc')).toBeCloseTo(1, 5)
  })

  it('handles 3-digit hex', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0)
  })

  it('returns null for unparseable input', () => {
    expect(contrastRatio('not-a-colour', '#fff')).toBeNull()
    expect(contrastRatio(null, '#fff')).toBeNull()
  })
})
