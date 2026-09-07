/**
 * Platform unit economics — "what does this deal actually cost me?"
 *
 * Computed once per agreement at generation time and stored on the Agreement,
 * so admin can see margin per deal and in aggregate. Every rate here is a
 * tunable assumption, not a quoted price — swap in real supplier numbers before
 * treating any of this as a business plan.
 */

/** Share of advertiser rent the platform keeps; the driver receives the rest. */
export const PLATFORM_TAKE_RATE = 0.25

/**
 * Printed + UV-laminated outdoor vinyl, per square metre.
 *
 * ≈ $9/sq ft, within the $8–12/sq ft trade range for material + print + laminate
 * (see docs/market-research.md). This EXCLUDES professional installation, since
 * drivers self-apply a single decal; a pro install would add $2–3/sq ft.
 *
 * An earlier $22/m² produced a $17 rear-window decal against a $150–400 market
 * rate for that placement, which made every margin figure in the app fictional.
 */
export const PRINT_COST_PER_SQM_CENTS = 9_500

/** Per-sticker cutting, weeding and packing, regardless of size. */
export const PRINT_SETUP_CENTS = 1_500

/** Flat shipping to the driver, one-off per installation. */
export const SHIPPING_COST_CENTS = 800

/** Simulated card processing: percentage + fixed, applied to the full contract. */
export const PROCESSING_RATE = 0.029
export const PROCESSING_FIXED_CENTS = 30

export type CostInput = {
  monthlyRentCents: number
  termMonths: number
  panelWidthCm: number
  panelHeightCm: number
}

export type CostBreakdown = {
  /** What the advertiser pays across the whole term. */
  totalValueCents: number
  driverPayoutCents: number
  printCostCents: number
  shippingCostCents: number
  processingFeeCents: number
  platformMarginCents: number
  /** Margin as a share of contract value, 0..1. Negative on a losing deal. */
  marginRatio: number
  /**
   * True when the deal loses money — a real risk on a large, cheap panel
   * (a roof at the rent floor costs more to print than it earns).
   */
  isUnprofitable: boolean
}

export function computeCosts(input: CostInput): CostBreakdown {
  const totalValueCents = input.monthlyRentCents * input.termMonths

  const areaSqm = (input.panelWidthCm / 100) * (input.panelHeightCm / 100)
  const printCostCents = Math.round(areaSqm * PRINT_COST_PER_SQM_CENTS) + PRINT_SETUP_CENTS

  const driverPayoutCents = Math.round(totalValueCents * (1 - PLATFORM_TAKE_RATE))
  const processingFeeCents =
    Math.round(totalValueCents * PROCESSING_RATE) + PROCESSING_FIXED_CENTS

  const platformMarginCents =
    totalValueCents -
    driverPayoutCents -
    printCostCents -
    SHIPPING_COST_CENTS -
    processingFeeCents

  return {
    totalValueCents,
    driverPayoutCents,
    printCostCents,
    shippingCostCents: SHIPPING_COST_CENTS,
    processingFeeCents,
    platformMarginCents,
    marginRatio: totalValueCents > 0 ? platformMarginCents / totalValueCents : 0,
    isUnprofitable: platformMarginCents <= 0,
  }
}

/**
 * The monthly rent at which a given panel and term breaks even. Useful as the
 * reserve-price suggestion when a driver creates a listing, so the platform
 * never carries a structurally loss-making deal.
 */
export function breakEvenMonthlyRentCents(
  termMonths: number,
  panelWidthCm: number,
  panelHeightCm: number,
): number {
  const areaSqm = (panelWidthCm / 100) * (panelHeightCm / 100)
  const fixed =
    Math.round(areaSqm * PRINT_COST_PER_SQM_CENTS) +
    PRINT_SETUP_CENTS +
    SHIPPING_COST_CENTS +
    PROCESSING_FIXED_CENTS

  // The driver takes total × (1 − takeRate), so the platform retains only
  // total × takeRate, and processing eats a further total × processingRate:
  //   margin = total × (takeRate − processingRate) − fixed
  // Solve margin >= 0 for total, where total = rent × termMonths.
  const retainedPerUnit = PLATFORM_TAKE_RATE - PROCESSING_RATE
  if (retainedPerUnit <= 0) {
    throw new Error(
      'Platform take rate must exceed the processing rate, or no rent can ever break even.',
    )
  }
  const requiredTotal = fixed / retainedPerUnit
  return Math.ceil(requiredTotal / termMonths)
}
