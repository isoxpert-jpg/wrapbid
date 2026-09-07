import { Prisma } from '@prisma/client'

import {
  ANTI_SNIPE_WINDOW_MS,
  MIN_INCREMENT_CENTS,
  MIN_INCREMENT_RATIO,
} from './constants'
import { computeCosts } from './costs'
import { prisma } from './db'
import { renderAgreement } from './agreementTemplate'
import { maskPlate } from './privacy'
import { qrSlug } from './qr'

/**
 * There is no cron in this prototype. Auctions resolve lazily: this runs at the
 * top of every listing/campaign/admin read and before every bid write.
 *
 * Correctness rests on the transaction below re-checking `status: 'ACTIVE'` in
 * its own WHERE clause, so two concurrent callers cannot both resolve the same
 * listing — the second one updates zero rows and bails.
 */
export async function resolveExpiredAuctions(): Promise<number> {
  const due = await prisma.panelListing.findMany({
    where: { status: 'ACTIVE', auctionEndsAt: { lte: new Date() } },
    select: { id: true },
  })

  let resolved = 0
  for (const { id } of due) {
    if (await resolveListing(id)) resolved++
  }
  return resolved
}

/** Resolves one listing. Returns true if this call is the one that resolved it. */
export async function resolveListing(listingId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // Claim the listing first. If another caller already moved it out of
    // ACTIVE, this updates nothing and we stop.
    const claimed = await tx.panelListing.updateMany({
      where: { id: listingId, status: 'ACTIVE', auctionEndsAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    })
    if (claimed.count === 0) return false

    const listing = await tx.panelListing.findUniqueOrThrow({
      where: { id: listingId },
      include: {
        panelType: true,
        vehicle: { include: { driver: true, commute: true } },
      },
    })

    const bids = await tx.bid.findMany({
      where: { listingId, status: { in: ['ACTIVE', 'OUTBID'] } },
      // Highest wins; on a tie the earlier bid wins.
      orderBy: [{ monthlyAmountCents: 'desc' }, { createdAt: 'asc' }],
      include: { campaign: true, advertiser: true, creative: true },
    })

    const reserve = listing.reserveRentCents ?? 0
    const winner = bids.find((b) => b.monthlyAmountCents >= reserve)

    if (!winner) {
      // No qualifying bid — the listing stays EXPIRED and every bid loses.
      await tx.bid.updateMany({ where: { listingId }, data: { status: 'LOST' } })
      return true
    }

    await tx.bid.update({ where: { id: winner.id }, data: { status: 'WON' } })
    await tx.bid.updateMany({
      where: { listingId, id: { not: winner.id } },
      data: { status: 'LOST' },
    })

    await tx.panelListing.update({
      where: { id: listingId },
      data: {
        status: 'SOLD',
        currentRentCents: winner.monthlyAmountCents,
        winningBidId: winner.id,
      },
    })

    const costs = computeCosts({
      monthlyRentCents: winner.monthlyAmountCents,
      termMonths: listing.termMonths,
      panelWidthCm: listing.panelType.widthCm,
      panelHeightCm: listing.panelType.heightCm,
    })

    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + listing.termMonths)

    const bodyMarkdown = renderAgreement({
      driverName: listing.vehicle.driver.name,
      driverPhone: listing.vehicle.driver.phone,
      advertiserName: winner.advertiser.name,
      campaignName: winner.campaign.name,
      vehicle: `${listing.vehicle.year} ${listing.vehicle.make} ${listing.vehicle.model} (${listing.vehicle.color})`,
      plateMasked: maskPlate(listing.vehicle.plateNumber),
      panelLabel: listing.panelType.label,
      panelWidthCm: listing.panelType.widthCm,
      panelHeightCm: listing.panelType.heightCm,
      monthlyRentCents: winner.monthlyAmountCents,
      termMonths: listing.termMonths,
      totalValueCents: costs.totalValueCents,
      driverPayoutCents: costs.driverPayoutCents,
      startDate,
      endDate,
      creativeName: winner.creative.fileName,
    })

    const agreement = await tx.agreement.create({
      data: {
        listingId,
        driverId: listing.vehicle.driverId,
        advertiserId: winner.advertiserId,
        campaignId: winner.campaignId,
        creativeId: winner.creativeId,
        monthlyRentCents: winner.monthlyAmountCents,
        termMonths: listing.termMonths,
        totalValueCents: costs.totalValueCents,
        startDate,
        endDate,
        driverPayoutCents: costs.driverPayoutCents,
        printCostCents: costs.printCostCents,
        shippingCostCents: costs.shippingCostCents,
        processingFeeCents: costs.processingFeeCents,
        platformMarginCents: costs.platformMarginCents,
        status: 'AWAITING_SIGNATURES',
        bodyMarkdown,
      },
    })

    // Blocked until BOTH parties sign — nothing gets printed on an unsigned deal.
    await tx.installation.create({
      data: {
        listingId,
        agreementId: agreement.id,
        qrSlug: qrSlug(),
        status: 'BLOCKED_UNSIGNED',
      },
    })

    await tx.campaign.update({
      where: { id: winner.campaignId },
      data: { spentCents: { increment: costs.totalValueCents } },
    })

    // Charge is recorded now. Driver payout is deliberately NOT posted here:
    // proof approval releases one monthly payout in the workflow route.
    const periodMonth = startDate.toISOString().slice(0, 7)
    await tx.ledgerEntry.create({
      data: {
          userId: winner.advertiserId,
          type: 'CHARGE',
          amountCents: winner.monthlyAmountCents,
          periodMonth,
          agreementId: agreement.id,
          note: `Rent — ${listing.panelType.label}`,
      },
    })

    return true
  })
}

/** The smallest bid that would be accepted on a listing right now. */
export function minimumBidCents(currentRentCents: number): number {
  return (
    currentRentCents +
    Math.max(MIN_INCREMENT_CENTS, Math.round(currentRentCents * MIN_INCREMENT_RATIO))
  )
}

export class BidRejected extends Error {
  status = 400
}

/**
 * Places a bid, enforcing every rule server-side. The UI's disabled states are a
 * convenience; these checks are the real gate.
 */
export async function placeBid(params: {
  listingId: string
  advertiserId: string
  campaignId: string
  creativeId: string
  monthlyAmountCents: number
}) {
  await resolveExpiredAuctions()

  return prisma.$transaction(async (tx) => {
    const listing = await tx.panelListing.findUnique({
      where: { id: params.listingId },
      include: { panelType: true, vehicle: true },
    })
    if (!listing) throw new BidRejected('That listing no longer exists.')
    if (listing.status !== 'ACTIVE') {
      throw new BidRejected('This auction has already closed.')
    }
    if (listing.auctionEndsAt <= new Date()) {
      throw new BidRejected('This auction has just closed.')
    }
    if (listing.vehicle.verificationStatus !== 'VERIFIED') {
      throw new BidRejected('This vehicle is not verified yet.')
    }
    if (listing.vehicle.driverId === params.advertiserId) {
      throw new BidRejected('You cannot bid on advertising space you own.')
    }

    const campaign = await tx.campaign.findUnique({
      where: { id: params.campaignId },
      include: { brand: true },
    })
    if (!campaign || campaign.advertiserId !== params.advertiserId) {
      throw new BidRejected('That campaign is not yours.')
    }
    if (campaign.status !== 'ACTIVE') {
      throw new BidRejected('That campaign is not active.')
    }
    const now = new Date()
    if (campaign.startsAt > now || campaign.endsAt < now) {
      throw new BidRejected('That campaign is outside its active dates.')
    }
    if (!campaign.brand || campaign.brand.status !== 'APPROVED') {
      throw new BidRejected('Your brand must be approved before you can bid.')
    }

    const target = await tx.campaignPanelTarget.findUnique({
      where: {
        campaignId_panelTypeCode: {
          campaignId: campaign.id,
          panelTypeCode: listing.panelTypeCode,
        },
      },
    })
    if (!target) throw new BidRejected('This panel type is not targeted by your campaign.')

    const creative = await tx.creative.findUnique({ where: { id: params.creativeId } })
    if (!creative || creative.campaignId !== campaign.id) {
      throw new BidRejected('Pick a piece of artwork from this campaign.')
    }

    const minimum = minimumBidCents(listing.currentRentCents)
    if (params.monthlyAmountCents < minimum) {
      throw new BidRejected(
        `Bid at least ${(minimum / 100).toFixed(2)} per month to beat the current price.`,
      )
    }

    // Budget check counts the FULL term, plus anything already committed on
    // other listings this campaign is currently winning.
    const committed = await tx.bid.findMany({
      where: {
        campaignId: campaign.id,
        status: 'ACTIVE',
        listingId: { not: listing.id },
        listing: { status: 'ACTIVE' },
      },
      include: { listing: { select: { termMonths: true, currentRentCents: true } } },
    })
    const committedTotal = committed
      .filter((b) => b.monthlyAmountCents >= b.listing.currentRentCents)
      .reduce((sum, b) => sum + b.monthlyAmountCents * b.listing.termMonths, 0)

    const thisTotal = params.monthlyAmountCents * listing.termMonths
    const remaining = campaign.budgetCents - campaign.spentCents - committedTotal

    if (thisTotal > remaining) {
      throw new BidRejected(
        `A ${listing.termMonths}-month term at that rent costs ${(thisTotal / 100).toFixed(
          2,
        )}, but only ${(remaining / 100).toFixed(2)} of this campaign's budget is uncommitted.`,
      )
    }

    await tx.bid.updateMany({
      where: { listingId: listing.id, status: 'ACTIVE' },
      data: { status: 'OUTBID' },
    })

    const bid = await tx.bid.create({
      data: {
        listingId: listing.id,
        campaignId: campaign.id,
        advertiserId: params.advertiserId,
        creativeId: creative.id,
        monthlyAmountCents: params.monthlyAmountCents,
        status: 'ACTIVE',
      },
    })

    // Risk flags inform review; they never auto-ban on one weak signal.
    const advertiser = await tx.user.findUniqueOrThrow({ where: { id: params.advertiserId } })
    const relationshipBids = await tx.bid.count({ where: {
      advertiserId: params.advertiserId,
      listing: { vehicle: { driverId: listing.vehicle.driverId } },
    } })
    const signals: { type: string; riskScore: number; details: string }[] = []
    if (Date.now() - advertiser.createdAt.getTime() < 7 * 86_400_000 && params.monthlyAmountCents >= listing.currentRentCents * 1.25) signals.push({ type: 'NEW_ACCOUNT_AGGRESSIVE_BID', riskScore: 45, details: 'Account under 7 days old raised the price by at least 25%.' })
    if (relationshipBids >= 3) signals.push({ type: 'REPEATED_DRIVER_BID_RELATIONSHIP', riskScore: 55, details: 'This advertiser has bid repeatedly on the same driver’s inventory.' })
    for (const signal of signals) await tx.fraudSignal.create({ data: { userId: params.advertiserId, listingId: listing.id, bidId: bid.id, ...signal } })

    // Anti-sniping: a late bid pushes the deadline out, so the auction can't be
    // stolen in the last second.
    const msLeft = listing.auctionEndsAt.getTime() - Date.now()
    const extended =
      msLeft < ANTI_SNIPE_WINDOW_MS
        ? new Date(Date.now() + ANTI_SNIPE_WINDOW_MS)
        : listing.auctionEndsAt

    await tx.panelListing.update({
      where: { id: listing.id },
      data: {
        currentRentCents: params.monthlyAmountCents,
        auctionEndsAt: extended,
      },
    })

    return {
      bid,
      deadlineExtended: extended.getTime() !== listing.auctionEndsAt.getTime(),
      newDeadline: extended,
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
