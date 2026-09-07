/** Great-circle distance helpers. No mapping API — this is the whole geo stack. */

const EARTH_RADIUS_KM = 6371

export type LatLng = { lat: number; lng: number }

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance in kilometres between two points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/** Is `point` within `radiusKm` of `centre`? */
export function isWithinRadius(centre: LatLng, point: LatLng, radiusKm: number): boolean {
  return haversineKm(centre, point) <= radiusKm
}

/**
 * How much of a commute falls inside an advertiser's target circle, as 0..1.
 * Samples the straight line between home and work — good enough to rank
 * listings by geographic relevance, and honest about being an approximation.
 */
export function routeOverlapFraction(
  home: LatLng,
  work: LatLng,
  centre: LatLng,
  radiusKm: number,
  samples = 24,
): number {
  let inside = 0
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const point: LatLng = {
      lat: home.lat + (work.lat - home.lat) * t,
      lng: home.lng + (work.lng - home.lng) * t,
    }
    if (isWithinRadius(centre, point, radiusKm)) inside++
  }
  return inside / (samples + 1)
}

/** Midpoint of the commute — used as a listing's coarse public location. */
export function midpoint(a: LatLng, b: LatLng): LatLng {
  return { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
}
