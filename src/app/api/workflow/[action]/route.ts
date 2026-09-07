import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'

import { placeBid } from '@/lib/auction'
import { prisma } from '@/lib/db'
import { computeExposure, startingRentCents } from '@/lib/pricing'
import { requireRole } from '@/lib/session'
import { MAX_UPLOAD_BYTES, ALLOWED_IMAGE_MIME } from '@/lib/constants'
import { nextSpotCheckDate, openVerificationCheck } from '@/lib/trust'
import { plateFingerprint } from '@/lib/identity'
import { uploadPrivateObject } from '@/lib/storage'
import {
  brandReviewSchema,
  brandSchema,
  campaignSchema,
  listingSchema,
  signSchema,
  vehicleSchema,
  verificationSchema,
} from '@/lib/validation'

function back(request: Request, path: string, key: 'ok' | 'error', message: string) {
  const url = new URL(path, request.url)
  url.searchParams.set(key, message)
  return NextResponse.redirect(url, 303)
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params
  if (!sameOrigin(request)) return new Response('Invalid origin', { status: 403 })
  const form = await request.formData()

  try {
    if (action === 'create-vehicle') {
      const user = await requireRole('DRIVER')
      if (form.get('acceptedEligibility') !== 'true') throw new Error('Confirm the driver and vehicle eligibility terms.')
      const decodeCity = (value: FormDataEntryValue | null) => {
        const [label, lat, lng] = String(value ?? '').split('|')
        return { label, lat, lng }
      }
      const home = decodeCity(form.get('homeChoice'))
      const work = decodeCity(form.get('workChoice'))
      const parsed = vehicleSchema.parse({
        ...Object.fromEntries(form), homeLabel: home.label, homeLat: home.lat, homeLng: home.lng,
        workLabel: work.label, workLat: work.lat, workLng: work.lng,
      })
      const exposure = computeExposure({
        home: { lat: parsed.homeLat, lng: parsed.homeLng },
        work: { lat: parsed.workLat, lng: parsed.workLng },
        commuteDaysPerWeek: parsed.commuteDaysPerWeek,
        areaType: parsed.areaType,
        parkingType: parsed.parkingType,
      })
      await prisma.vehicle.create({
        data: {
          driverId: user.id,
          make: parsed.make,
          model: parsed.model,
          year: parsed.year,
          color: parsed.color,
          bodyType: parsed.bodyType,
          plateNumber: parsed.plateNumber,
          plateHash: plateFingerprint(parsed.plateNumber),
          verificationStatus: 'PENDING_REVIEW',
          commute: { create: {
            homeLabel: parsed.homeLabel, homeLat: parsed.homeLat, homeLng: parsed.homeLng,
            workLabel: parsed.workLabel, workLat: parsed.workLat, workLng: parsed.workLng,
            commuteDaysPerWeek: parsed.commuteDaysPerWeek, areaType: parsed.areaType,
            parkingType: parsed.parkingType, straightLineKm: exposure.straightLineKm,
            roadKm: exposure.roadKm, monthlyKm: exposure.monthlyKm,
            estMonthlyImpressions: exposure.estMonthlyImpressions,
            exposureScore: exposure.exposureScore,
          } },
        },
      })
      await prisma.user.update({ where: { id: user.id }, data: { driverTermsAcceptedAt: new Date() } })
      return back(request, '/driver', 'ok', 'Vehicle submitted for verification.')
    }

    if (action === 'create-listings') {
      const user = await requireRole('DRIVER')
      const parsed = listingSchema.parse({
        vehicleId: form.get('vehicleId'), panelTypeCodes: form.getAll('panelTypeCodes'),
        termMonths: form.get('termMonths'), auctionHours: form.get('auctionHours'),
        reserveRentCents: form.get('reserveRentCents') || undefined,
      })
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: parsed.vehicleId, driverId: user.id }, include: { commute: true },
      })
      if (!vehicle || vehicle.verificationStatus !== 'VERIFIED' || !vehicle.commute) {
        throw new Error('Only your verified vehicles can be listed.')
      }
      const panels = await prisma.panelType.findMany({ where: { code: { in: parsed.panelTypeCodes } } })
      if (panels.length !== new Set(parsed.panelTypeCodes).size) throw new Error('Unknown panel type.')
      const ends = new Date(Date.now() + parsed.auctionHours * 3_600_000)
      await prisma.$transaction(panels.map((panel) => {
        const rent = startingRentCents(panel.baseRateCents, vehicle.commute!.exposureScore)
        return prisma.panelListing.create({ data: {
          vehicleId: vehicle.id, panelTypeCode: panel.code, startingRentCents: rent,
          currentRentCents: rent, reserveRentCents: parsed.reserveRentCents,
          termMonths: parsed.termMonths, baseRateSnapshotCents: panel.baseRateCents,
          exposureSnapshot: vehicle.commute!.exposureScore, auctionEndsAt: ends,
        } })
      }))
      return back(request, '/driver', 'ok', `${panels.length} panel listing(s) started.`)
    }

    if (action === 'create-brand') {
      const user = await requireRole('ADVERTISER')
      const parsed = brandSchema.parse(Object.fromEntries(form))
      await prisma.brand.create({ data: {
        ownerId: user.id, name: parsed.name,
        slug: `${parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${user.id.slice(-5)}`,
        industry: parsed.industry, description: parsed.description,
        website: parsed.website || null, contactEmail: parsed.contactEmail || user.email,
        products: { create: { name: `${parsed.name} featured product`, description: parsed.description,
          category: parsed.industry, targetAudience: 'Local commuters' } },
      } })
      return back(request, '/advertise', 'ok', 'Brand submitted for approval.')
    }

    if (action === 'create-campaign') {
      const user = await requireRole('ADVERTISER')
      const [targetLabel, targetLat, targetLng] = String(form.get('targetChoice') ?? '').split('|')
      const parsed = campaignSchema.parse({ ...Object.fromEntries(form), targetLabel, targetLat, targetLng,
        panelTypeCodes: form.getAll('panelTypeCodes') })
      const brand = await prisma.brand.findUnique({ where: { ownerId: user.id } })
      const product = await prisma.product.findFirst({ where: { id: parsed.productId, brandId: brand?.id } })
      if (!brand || !product) throw new Error('Choose a product belonging to your brand.')
      await prisma.campaign.create({ data: {
        advertiserId: user.id, brandId: brand.id, productId: product.id, name: parsed.name,
        budgetCents: parsed.budgetCents, targetLabel: parsed.targetLabel,
        targetLat: parsed.targetLat, targetLng: parsed.targetLng, targetRadiusKm: parsed.targetRadiusKm,
        productCategory: product.category, landingUrl: parsed.landingUrl, status: 'ACTIVE',
        startsAt: new Date(), endsAt: new Date(Date.now() + parsed.termDays * 86_400_000),
        panelTargets: { create: parsed.panelTypeCodes.map(panelTypeCode => ({ panelTypeCode })) },
        creatives: { create: { fileName: `${brand.slug}-creative.svg`,
          filePath: `/api/placeholder/${encodeURIComponent(brand.name)}/1a56db`,
          mimeType: 'image/svg+xml', widthPx: 2400, heightPx: 1200,
          dominantHex: '#1a56db', isPrimary: true } },
      } })
      return back(request, '/advertise/campaigns', 'ok', 'Campaign created.')
    }

    if (action === 'bid') {
      const user = await requireRole('ADVERTISER')
      const listingId = String(form.get('listingId') ?? '')
      await placeBid({
        listingId, advertiserId: user.id, campaignId: String(form.get('campaignId') ?? ''),
        creativeId: String(form.get('creativeId') ?? ''),
        monthlyAmountCents: Number(form.get('monthlyAmountCents')),
      })
      return back(request, '/advertise', 'ok', 'Bid placed.')
    }

    if (action === 'verify-vehicle') {
      await requireRole('ADMIN')
      const vehicleId = String(form.get('vehicleId') ?? '')
      const parsed = verificationSchema.parse(Object.fromEntries(form))
      const vehicle = await prisma.vehicle.findUniqueOrThrow({ where: { id: vehicleId } })
      await prisma.vehicle.update({ where: { id: vehicleId }, data: {
        verificationStatus: parsed.status, conditionRating: parsed.conditionRating,
        verificationNotes: parsed.notes || null,
        verifiedAt: parsed.status === 'VERIFIED' ? new Date() : null,
        plateHash: parsed.status === 'VERIFIED' && vehicle.plateNumber ? plateFingerprint(vehicle.plateNumber) : vehicle.plateHash,
      } })
      return back(request, '/admin/verification', 'ok', 'Vehicle review saved.')
    }

    if (action === 'review-brand') {
      await requireRole('ADMIN')
      const brandId = String(form.get('brandId') ?? '')
      const parsed = brandReviewSchema.parse(Object.fromEntries(form))
      await prisma.brand.update({ where: { id: brandId }, data: {
        status: parsed.status, reviewNotes: parsed.notes || null,
        reviewedAt: parsed.status === 'PENDING_REVIEW' ? null : new Date(),
      } })
      return back(request, '/admin/verification', 'ok', 'Brand review saved.')
    }

    if (action === 'sign-agreement') {
      const user = await requireRole('DRIVER', 'ADVERTISER')
      const agreementId = String(form.get('agreementId') ?? '')
      const parsed = signSchema.parse({ signedName: form.get('signedName'), accepted: form.get('accepted') === 'true' })
      await prisma.$transaction(async tx => {
        const agreement = await tx.agreement.findUnique({ where: { id: agreementId } })
        if (!agreement || (agreement.driverId !== user.id && agreement.advertiserId !== user.id)) throw new Error('Agreement not found.')
        if (agreement.status !== 'AWAITING_SIGNATURES') throw new Error('This agreement is not awaiting signatures.')
        const data = user.role === 'DRIVER'
          ? { driverSignedAt: new Date(), driverSignedName: parsed.signedName }
          : { advertiserSignedAt: new Date(), advertiserSignedName: parsed.signedName }
        const updated = await tx.agreement.update({ where: { id: agreement.id }, data })
        if (updated.driverSignedAt && updated.advertiserSignedAt) {
          await tx.agreement.update({ where: { id: agreement.id }, data: { status: 'ACTIVE' } })
          await tx.installation.update({ where: { agreementId: agreement.id }, data: { status: 'PENDING_PRINT' } })
        }
      })
      const path = user.role === 'DRIVER' ? '/driver/agreements' : '/advertise/agreements'
      return back(request, path, 'ok', 'Signature recorded.')
    }

    if (action === 'request-proof') {
      await requireRole('ADMIN')
      const installationId = String(form.get('installationId') ?? '')
      await prisma.installation.findUniqueOrThrow({ where: { id: installationId } })
      await openVerificationCheck(installationId, String(form.get('type')) === 'SPOT_CHECK' ? 'SPOT_CHECK' : 'INITIAL')
      return back(request, '/admin/installations', 'ok', 'A fresh 24-hour challenge was issued.')
    }

    if (action === 'submit-proof') {
      const user = await requireRole('DRIVER')
      const checkId = String(form.get('checkId') ?? '')
      const file = form.get('photo')
      const check = await prisma.verificationCheck.findUnique({ where: { id: checkId }, include: { installation: { include: { agreement: true } } } })
      if (!check || check.installation.agreement.driverId !== user.id) throw new Error('Verification check not found.')
      if (check.status !== 'OPEN' || check.expiresAt < new Date()) throw new Error('This challenge has expired.')
      if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('Choose an image under 5 MB.')
      if (!ALLOWED_IMAGE_MIME.includes(file.type as never)) throw new Error('Use a PNG, JPEG, or WebP image.')
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const filename = `${randomUUID()}.${extension}`
      const objectPath = `proofs/${check.installationId}/${filename}`
      await uploadPrivateObject(objectPath, Buffer.from(await file.arrayBuffer()), file.type)
      await prisma.$transaction([
        prisma.installationProof.create({ data: { installationId: check.installationId, checkId: check.id, photoPath: objectPath, mimeType: file.type, capturedAt: new Date() } }),
        prisma.verificationCheck.update({ where: { id: check.id }, data: { status: 'SUBMITTED', completedAt: new Date() } }),
      ])
      return back(request, '/driver/agreements', 'ok', 'Fresh proof submitted for review.')
    }

    if (action === 'review-proof') {
      const admin = await requireRole('ADMIN')
      const proofId = String(form.get('proofId') ?? '')
      const approved = form.get('decision') === 'APPROVED'
      const proof = await prisma.installationProof.findUniqueOrThrow({ where: { id: proofId }, include: { installation: { include: { agreement: true, listing: { include: { panelType: true } } } } } })
      await prisma.$transaction(async tx => {
        const claimed = await tx.installationProof.updateMany({ where: { id: proof.id, status: 'PENDING_REVIEW' }, data: { status: approved ? 'APPROVED' : 'REJECTED', reviewedAt: new Date(), reviewedBy: admin.id, reviewNotes: String(form.get('notes') ?? '') || null } })
        if (claimed.count === 0) throw new Error('This proof has already been reviewed.')
        await tx.verificationCheck.update({ where: { id: proof.checkId }, data: { status: approved ? 'APPROVED' : 'REJECTED' } })
        await tx.installation.update({ where: { id: proof.installationId }, data: approved ? { status: 'VERIFIED', verifiedAt: new Date(), nextCheckAt: nextSpotCheckDate() } : { status: 'INSTALLED', nextCheckAt: null } })
        if (approved) {
          const periodMonth = new Date().toISOString().slice(0, 7)
          const existing = await tx.ledgerEntry.findFirst({ where: { userId: proof.installation.agreement.driverId, agreementId: proof.installation.agreementId, type: 'PAYOUT', periodMonth } })
          if (!existing) await tx.ledgerEntry.create({ data: { userId: proof.installation.agreement.driverId, type: 'PAYOUT', amountCents: Math.round(proof.installation.agreement.driverPayoutCents / proof.installation.agreement.termMonths), periodMonth, agreementId: proof.installation.agreementId, note: `Verified panel rent — ${proof.installation.listing.panelType.label}` } })
        }
      })
      return back(request, '/admin/installations', 'ok', approved ? 'Proof approved; payout eligibility restored.' : 'Proof rejected; payout remains held.')
    }

    if (action === 'review-fraud') {
      await requireRole('ADMIN')
      await prisma.fraudSignal.update({ where: { id: String(form.get('signalId') ?? '') }, data: { status: String(form.get('status') ?? '') === 'CONFIRMED' ? 'CONFIRMED' : 'DISMISSED' } })
      return back(request, '/admin', 'ok', 'Fraud signal reviewed.')
    }

    if (action === 'upload-creative') {
      const user = await requireRole('ADVERTISER')
      const campaignId = String(form.get('campaignId') ?? '')
      const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, advertiserId: user.id } })
      if (!campaign) throw new Error('Campaign not found.')
      const file = form.get('artwork')
      if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('Choose artwork under 5 MB.')
      if (!ALLOWED_IMAGE_MIME.includes(file.type as never)) throw new Error('Use PNG, JPEG, or WebP artwork.')
      const bytes = Buffer.from(await file.arrayBuffer())
      const image = sharp(bytes)
      const [metadata, stats] = await Promise.all([image.metadata(), image.stats()])
      if (!metadata.width || !metadata.height) throw new Error('Could not read the artwork dimensions.')
      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const filename = `${randomUUID()}.${extension}`
      const objectPath = `creatives/${campaignId}/${filename}`
      await uploadPrivateObject(objectPath, bytes, file.type)
      const dominant = stats.dominant
      const dominantHex = `#${[dominant.r,dominant.g,dominant.b].map(x=>x.toString(16).padStart(2,'0')).join('')}`
      const creative = await prisma.creative.create({ data: { campaignId, fileName: file.name.slice(0,120), filePath: objectPath, mimeType: file.type, widthPx: metadata.width, heightPx: metadata.height, dominantHex, isPrimary: form.get('isPrimary') === 'true' } })
      if (creative.isPrimary) await prisma.creative.updateMany({ where: { campaignId, id: { not: creative.id } }, data: { isPrimary: false } })
      const source = String(form.get('returnTo') ?? '')
      const destination = source === 'studio' ? `/advertise/studio?campaign=${campaignId}&creative=${creative.id}` : `/advertise/campaigns/${campaignId}`
      return back(request, destination, 'ok', 'Artwork uploaded. Preview it on every panel below.')
    }

    if (action === 'save-placement') {
      const user = await requireRole('ADVERTISER')
      const listingId=String(form.get('listingId')??'');const creativeId=String(form.get('creativeId')??'')
      const creative=await prisma.creative.findFirst({where:{id:creativeId,campaign:{advertiserId:user.id}}})
      const listing=await prisma.panelListing.findUnique({where:{id:listingId}})
      if(!creative||!listing)throw new Error('Listing or creative not found.')
      const number=(name:string,min:number,max:number)=>{const value=Number(form.get(name));if(!Number.isFinite(value)||value<min||value>max)throw new Error(`Invalid ${name}.`);return value}
      await prisma.creativePlacement.upsert({where:{creativeId_listingId:{creativeId,listingId}},update:{scale:number('scale',.4,1),offsetX:number('offsetX',-.3,.3),offsetY:number('offsetY',-.2,.2),rotation:number('rotation',-.5,.5)},create:{creativeId,listingId,scale:number('scale',.4,1),offsetX:number('offsetX',-.3,.3),offsetY:number('offsetY',-.2,.2),rotation:number('rotation',-.5,.5)}})
      return back(request,`/advertise/listings/${listingId}`,'ok','Placement finalized. Download the production proof or open the plotter print view.')
    }

    return new Response('Unknown action', { status: 404 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.'
    const fallback = request.headers.get('referer') || '/'
    return back(request, fallback, 'error', message)
  }
}
