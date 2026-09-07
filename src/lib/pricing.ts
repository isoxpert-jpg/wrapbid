/**
 * The pricing model: a driver's commute becomes an exposure score, and that
 * score scales each panel's base monthly rent.
 *
 * Every function here is pure so it can be unit-tested and reused identically
 * on the server (listing creation) and the client (live wizard preview).
 */

import {
  AREA_MULTIPLIERS,
  EXPOSURE_MAX,
  EXPOSURE_MIN,
  IMPRESSIONS_PER_KM,
  MIN_PRINT_DPI,
  MIN_RENT_CENTS,
  PARKING_MULTIPLIERS,
  REFERENCE_IMPRESSIONS,
  ROAD_DETOUR_FACTOR,
  WEEKS_PER_MONTH,
  type AreaType,
  type ParkingType,
} from './constants'
import { haversineKm, type LatLng } from './geo'

export type ExposureInput = {
  home: LatLng
  work: LatLng
  commuteDaysPerWeek: number
  areaType: AreaType
  parkingType: ParkingType
}

export type ExposureResult = {
  straightLineKm: number
  roadKm: number
  dailyKm: number
  monthlyKm: number
  estMonthlyImpressions: number
  exposureScore: number
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** Commute geometry → estimated monthly impressions → exposure score. */
export function computeExposure(input: ExposureInput): ExposureResult {
  const straightLineKm = haversineKm(input.home, input.work)
  const roadKm = straightLineKm * ROAD_DETOUR_FACTOR
  const dailyKm = roadKm * 2 // there and back
  const monthlyKm = dailyKm * input.commuteDaysPerWeek * WEEKS_PER_MONTH

  const estMonthlyImpressions = Math.round(
    monthlyKm *
      IMPRESSIONS_PER_KM *
      AREA_MULTIPLIERS[input.areaType] *
      PARKING_MULTIPLIERS[input.parkingType],
  )

  const exposureScore = clamp(
    estMonthlyImpressions / REFERENCE_IMPRESSIONS,
    EXPOSURE_MIN,
    EXPOSURE_MAX,
  )

  return {
    straightLineKm: round2(straightLineKm),
    roadKm: round2(roadKm),
    dailyKm: round2(dailyKm),
    monthlyKm: round2(monthlyKm),
    estMonthlyImpressions,
    exposureScore: round2(exposureScore),
  }
}

/** A panel's starting monthly rent, in cents. */
export function startingRentCents(baseRateCents: number, exposureScore: number): number {
  return Math.max(MIN_RENT_CENTS, Math.round(baseRateCents * exposureScore))
}

/**
 * Cost per thousand impressions — the number advertisers actually compare
 * against billboards and transit. Returns null when there are no impressions
 * to divide by rather than returning Infinity.
 */
export function effectiveCpmCents(
  monthlyRentCents: number,
  estMonthlyImpressions: number,
): number | null {
  if (estMonthlyImpressions <= 0) return null
  return round2(monthlyRentCents / (estMonthlyImpressions / 1000))
}

/**
 * Will this artwork actually print sharply at panel size?
 * The most common failure in vehicle graphics is art that looks fine on screen
 * and soft at 1.2 metres wide.
 */
export function printResolution(imageWidthPx: number, panelWidthCm: number) {
  const panelWidthInches = panelWidthCm / 2.54
  const dpi = imageWidthPx / panelWidthInches
  return {
    dpi: Math.round(dpi),
    ok: dpi >= MIN_PRINT_DPI,
    /** Pixel width needed to clear the DPI floor at this panel size. */
    recommendedWidthPx: Math.ceil(MIN_PRINT_DPI * panelWidthInches),
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Format integer cents as a display string. */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
