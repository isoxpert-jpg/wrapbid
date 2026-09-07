import { z } from 'zod'

import {
  AREA_TYPES,
  BODY_TYPES,
  PARKING_TYPES,
  PHOTO_VIEWS,
  MAX_VEHICLE_AGE_YEARS,
} from './constants'

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address.')

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Use at least 8 characters.'),
  name: z.string().trim().min(2, 'Tell us your name.'),
  role: z.enum(['DRIVER', 'ADVERTISER']),
  phone: z.string().trim().max(32).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})

export const exposureSchema = z.object({
  homeLat: z.coerce.number().min(-90).max(90),
  homeLng: z.coerce.number().min(-180).max(180),
  workLat: z.coerce.number().min(-90).max(90),
  workLng: z.coerce.number().min(-180).max(180),
  commuteDaysPerWeek: z.coerce.number().int().min(1).max(7),
  areaType: z.enum(AREA_TYPES),
  parkingType: z.enum(PARKING_TYPES),
})

export const vehicleSchema = exposureSchema.extend({
  make: z.string().trim().min(1, 'Required.'),
  model: z.string().trim().min(1, 'Required.'),
  year: z.coerce.number().int()
    .min(new Date().getFullYear() - MAX_VEHICLE_AGE_YEARS, `Vehicle must be no more than ${MAX_VEHICLE_AGE_YEARS} years old.`)
    .max(new Date().getFullYear() + 1),
  color: z.string().trim().min(1, 'Required.'),
  bodyType: z.enum(BODY_TYPES),
  plateNumber: z.string().trim().min(2, 'Required for verification.').max(24),
  homeLabel: z.string().trim().min(1),
  workLabel: z.string().trim().min(1),
})

export const listingSchema = z.object({
  vehicleId: z.string().min(1),
  panelTypeCodes: z.array(z.string().min(1)).min(1, 'Pick at least one panel.'),
  termMonths: z.coerce.number().int().min(1).max(24),
  /** Auction length, in hours. The UI offers short options for demoing. */
  auctionHours: z.coerce.number().min(0.03).max(24 * 14),
  reserveRentCents: z.coerce.number().int().min(0).optional(),
})

export const brandSchema = z.object({
  name: z.string().trim().min(2, 'Enter your brand name.').max(80),
  industry: z.string().trim().min(2, 'Required.'),
  description: z.string().trim().min(20, 'Give buyers at least a sentence or two.').max(1000),
  website: z.string().trim().url('Enter a full URL, including https://').optional().or(z.literal('')),
  contactEmail: emailSchema.optional().or(z.literal('')),
})

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Required.').max(120),
  description: z.string().trim().min(10, 'Describe the product briefly.').max(1000),
  category: z.string().trim().min(2, 'Required.'),
  priceCents: z.coerce.number().int().min(0).optional(),
  targetAudience: z.string().trim().max(300).optional().or(z.literal('')),
})

export const campaignSchema = z.object({
  name: z.string().trim().min(2, 'Name your campaign.').max(120),
  productId: z.string().min(1, 'Pick the product this campaign promotes.'),
  budgetCents: z.coerce.number().int().min(1_000, 'Set a budget of at least $10.'),
  targetLabel: z.string().trim().min(1),
  targetLat: z.coerce.number().min(-90).max(90),
  targetLng: z.coerce.number().min(-180).max(180),
  targetRadiusKm: z.coerce.number().min(1).max(200),
  landingUrl: z.string().trim().url('Enter a full URL, including https://'),
  panelTypeCodes: z.array(z.string()).min(1, 'Pick at least one panel type.'),
  termDays: z.coerce.number().int().min(28, 'Physical campaigns run for at least four weeks.').max(730),
})

export const bidSchema = z.object({
  campaignId: z.string().min(1, 'Pick a campaign.'),
  creativeId: z.string().min(1, 'Pick the artwork you want to run.'),
  monthlyAmountCents: z.coerce.number().int().min(1),
})

export const signSchema = z.object({
  signedName: z.string().trim().min(2, 'Type your full name to sign.'),
  accepted: z.literal(true, { message: 'You must confirm you accept the terms.' }),
})

export const photoViewSchema = z.enum(PHOTO_VIEWS)

export const calibrationSchema = z.object({
  vehiclePhotoId: z.string().min(1),
  panelTypeCode: z.string().min(1),
  points: z
    .array(z.object({ x: z.number().min(-0.5).max(1.5), y: z.number().min(-0.5).max(1.5) }))
    .length(4, 'A panel needs exactly four corners.'),
})

export const installationStatusSchema = z.object({
  status: z.enum(['PENDING_PRINT', 'SHIPPED', 'INSTALLED', 'VERIFIED', 'REMOVED']),
  adminNotes: z.string().trim().max(500).optional().or(z.literal('')),
})

export const verificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'PENDING_REVIEW']),
  conditionRating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

export const brandReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING_REVIEW']),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
})

/** Turns a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
