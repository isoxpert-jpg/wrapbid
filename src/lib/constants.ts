/**
 * Every tunable assumption in the product lives here, each with a comment
 * naming what it assumes. These are MODELLING ESTIMATES, not measured facts —
 * the UI must present derived impression figures as estimates, never guarantees.
 */

export const APP_NAME = 'Wrapbid'
export const APP_TAGLINE = 'Auction your commute.'

// ---------------------------------------------------------------- enums
// SQLite + Prisma supports no `enum`, so these are the source of truth and the
// DB columns are plain strings validated against them.

export const ROLES = ['DRIVER', 'ADVERTISER', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

export const BODY_TYPES = ['SEDAN', 'SUV', 'HATCHBACK', 'PICKUP', 'VAN'] as const
export type BodyType = (typeof BODY_TYPES)[number]

export const AREA_TYPES = ['URBAN_CORE', 'URBAN', 'SUBURBAN', 'RURAL'] as const
export type AreaType = (typeof AREA_TYPES)[number]

export const PARKING_TYPES = ['STREET_BUSY', 'LOT', 'GARAGE'] as const
export type ParkingType = (typeof PARKING_TYPES)[number]

export const PHOTO_VIEWS = ['SIDE_DRIVER', 'SIDE_PASSENGER', 'REAR', 'FRONT', 'PLATE'] as const
export type PhotoView = (typeof PHOTO_VIEWS)[number]

export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED'] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const LISTING_STATUSES = ['DRAFT', 'ACTIVE', 'SOLD', 'EXPIRED', 'WITHDRAWN'] as const
export type ListingStatus = (typeof LISTING_STATUSES)[number]

export const BID_STATUSES = ['ACTIVE', 'OUTBID', 'WON', 'LOST'] as const
export type BidStatus = (typeof BID_STATUSES)[number]

export const CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export const AGREEMENT_STATUSES = ['AWAITING_SIGNATURES', 'ACTIVE', 'COMPLETED', 'TERMINATED'] as const
export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number]

export const INSTALLATION_STATUSES = [
  'BLOCKED_UNSIGNED',
  'PENDING_PRINT',
  'SHIPPED',
  'INSTALLED',
  'VERIFIED',
  'REMOVED',
] as const
export type InstallationStatus = (typeof INSTALLATION_STATUSES)[number]

// ---------------------------------------------------------------- pricing

/** Straight-line → road distance. 1.30 is a common urban detour index. */
export const ROAD_DETOUR_FACTOR = 1.3

/** Weeks per month (52 / 12). */
export const WEEKS_PER_MONTH = 4.33

/**
 * Assumed eyeballs per kilometre driven, at suburban density.
 * This is the single most load-bearing assumption in the pricing model.
 */
export const IMPRESSIONS_PER_KM = 45

/**
 * Impressions that define exposureScore = 1.0 — calibrated to a "typical"
 * commuter: 14km each way straight-line, 5 days a week, suburban, lot parking,
 * which works out to ~790 road-km and ~35k impressions per month.
 *
 * This value MUST be kept in step with IMPRESSIONS_PER_KM. Setting it too low
 * pins every real commute against EXPOSURE_MAX and flattens the whole model —
 * pricing.test.ts guards against that regression.
 */
export const REFERENCE_IMPRESSIONS = 35_000

/**
 * Exposure is clamped so outliers can't produce rents the market would never pay.
 * Calibrated against competitor rate cards — see docs/market-research.md.
 *
 * The observed driver-payout band across live operators is $100–$450/month
 * (Carvertise base $100; Wrapify documented ~$164–180; Good Traffic $375–500).
 * With a ~$57 average panel rate and five sellable panels, a fully-sold car pays
 * the driver ~$285/mo at 1.0×, ~$712 at the 2.5× ceiling, ~$142 at the 0.5× floor.
 *
 * A previous 4.0 ceiling implied ~$1,150/mo to the driver, which at the market's
 * observed advertiser/driver spread would need $3,000–7,700/mo from the
 * advertiser — against Carvertise's derived ~$667/vehicle/month. It would never
 * have cleared. A 0.25 floor implied ~$70/mo, below every competitor's floor.
 */
export const EXPOSURE_MIN = 0.5
export const EXPOSURE_MAX = 2.5

/** Floor on monthly rent, in cents — below this a listing isn't worth printing. */
export const MIN_RENT_CENTS = 1_500

/** How much busier an area is than the suburban baseline. */
export const AREA_MULTIPLIERS: Record<AreaType, number> = {
  URBAN_CORE: 1.6,
  URBAN: 1.35,
  SUBURBAN: 1.0,
  RURAL: 0.6,
}

/** Where the car sits while parked — parked hours are exposure too. */
export const PARKING_MULTIPLIERS: Record<ParkingType, number> = {
  STREET_BUSY: 1.15,
  LOT: 1.0,
  GARAGE: 0.9,
}

/** Pre-selects the area dropdown; the driver's explicit choice always wins. */
export function suggestAreaType(roadKm: number): AreaType {
  if (roadKm < 8) return 'URBAN'
  if (roadKm <= 25) return 'SUBURBAN'
  return 'RURAL'
}

// ---------------------------------------------------------------- auction

/** Minimum bid increment: the greater of this and MIN_INCREMENT_RATIO. */
export const MIN_INCREMENT_CENTS = 100
export const MIN_INCREMENT_RATIO = 0.05

/** A bid inside this window pushes the deadline out by the same amount. */
export const ANTI_SNIPE_WINDOW_MS = 2 * 60 * 1000

// ---------------------------------------------------------------- print

/** Below this, artwork will look soft at panel size. Industry rule of thumb. */
export const MIN_PRINT_DPI = 100

/** Max upload size for a creative or vehicle photo. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Older paint and bodywork materially increase decal and brand-quality risk. */
export const MAX_VEHICLE_AGE_YEARS = 15

export const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const
