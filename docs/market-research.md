# Competitive landscape — vehicle advertising marketplaces

Research date: 6 September 2026. Every figure below carries a source URL; `[CLAIM]` marks
a marketing claim, `[DOC]` an independently documented figure, ⚠ marks stale data.

This file exists because the pricing constants in `src/lib/constants.ts` and
`src/lib/costs.ts` are calibrated against it. If you change a rate, check it here first.

---

## Headline findings

1. **No physical-wrap operator anywhere uses auction pricing, per-panel pricing, or
   advertiser-visible route-based pricing.** Every live operator is fixed-rate plus manual
   campaign matching, sold by a salesperson.
2. **Self-serve, price-visible purchase is the clearest unoccupied gap.** Zero car-wrap
   operators let you see a price without contacting sales.
3. **Demand, not supply, kills these companies.** Two UK operators are legally dissolved,
   several US/AU ones are dead domains. Documented driver experience is "sign up and never
   hear anything."

## Competitor summary

| Company | Markets | Driver pay/mo | Advertiser pricing | Auction? | Self-serve? |
|---|---|---|---|---|---|
| Carvertise | Top 200 US | $100 base `[DOC]` | Quote-only | No | No |
| Wrapify (Wrapmate-owned) | US | $174–452 `[CLAIM]`; ~$164–180 `[DOC]` | Quote-only | No | No |
| Nickelytics (Kiwibot-owned) | US | $150–250 `[CLAIM]` | Quote-only | No | No |
| Firefly | US cities | $200–300 `[CLAIM]` | Direct + **programmatic** | **Yes — digital tops only** | Via DSPs |
| Good Traffic (ex-mobilads) | US/UK/MX/BR/CA/AR/DE/AU | $375–500 `[CLAIM]` | Quote-only | No | No |
| Wrappr | Australia | AUD 900–1500 / 3mo `[CLAIM]` | Not published | No | No |
| ReferralCars | US | Driver *pays*; commission only | N/A | No | N/A |

**Dead or defunct:** StickerRide (UK entity dissolved Feb 2023), Car Quids (deadpooled),
Adverttu (liquidation Aug 2024) / Drovo (dissolved Nov 2025), Pay Me For Driving, Ads on
Wheels AU, OpenAds AU, BuyMyBumper. **There is no verified live UK operator paying private
drivers.**

## Pricing benchmarks that calibrate this codebase

### Driver payouts — the credible band is **$100–$450/month**

| Source | Figure |
|---|---|
| Carvertise base (own site) | $100 `[DOC]` |
| Wrapify advertised tiers | $174–$452 `[CLAIM]` |
| Wrapify **documented actual** | ~$164–180 `[DOC]` — *below every advertised tier* |
| Good Traffic | $375–$500 `[CLAIM]` |
| Anything ≥ $700/week | Fraud — see FTC alert below |

### Advertiser CPM — wrap CPM sits at **$1.78–$3.50**

| Medium | CPM | Quality |
|---|---|---|
| OOH bulletins (billboards) | $3.00–$10.00 | ★ Solomon Partners/OAAA, June 2025 |
| Transit shelters | $2.00–$7.00 | ★ Solomon/OAAA 2025 |
| **Carvertise car wraps** | **$2.50–$3.50** | ⚠ Jul 2021 |
| **Wrapify car wraps** | **$1.78 avg** | ⚠ Feb 2017 |
| "Vehicle wraps $0.48" | **unusable** — undated, 3M-sponsored, 10-truck sample |

> **There is no audited industry CPM for this medium.** OAAA's own June 2025 benchmark has
> no vehicle-wrap line. Every wrap CPM in circulation is vendor-sourced and stale.

### Print / fulfilment costs

| Item | Cost |
|---|---|
| Rear-window placement | **$150–$400** |
| Spot graphics / door + tailgate decals | **$300–$1,000** |
| Material | $8–$12 per sq ft (≈ $86–129/m²) |
| Professional install labour | $2–$3 per sq ft |
| Full wrap, printed + installed | $2,500–$7,000 |

### Derived take rate (arithmetic, not a published figure)

Carvertise's ~$40,000 / 20 cars / 3 months = **~$667 per vehicle per month gross** against
**$100–$250/month** to the driver — a driver share of roughly **15–37%**. ⚠ 2021, one data
point, not a benchmark.

## How this changed our model

| Constant | Was | Now | Why |
|---|---|---|---|
| `EXPOSURE_MAX` | 4.0 | **2.5** | At 4×, a fully-sold car paid the driver ~$1,150/mo, implying $3,000–7,700/mo to the advertiser vs Carvertise's derived ~$667. The ceiling would never clear. |
| `EXPOSURE_MIN` | 0.25 | **0.5** | At 0.25×, a fully-sold car paid ~$70/mo — below every live competitor's floor and likely below a driver's reservation price. |
| `PRINT_COST_PER_SQM_CENTS` | $22/m² | **$95/m²** | $22/m² produced a $17 rear-window decal against a $150–400 market rate. $95/m² ≈ $9/sq ft material, consistent with the trade range for print + UV laminate, excluding install (drivers self-install). |
| `PRINT_SETUP_CENTS` | $5 | **$15** | Cutting, weeding, packing per unit. |
| Match-score CPM band | $8 excellent → $40 poor | **$1.50 excellent → $8 poor** | The old band was calibrated to digital place-based OOH, not vehicle wraps. |

With these, a fully-sold car at 1.0× exposure pays the driver **~$285/month** — inside the
observed $100–$450 band and above every competitor's documented floor. At the 2.5× ceiling
it is ~$712/month; at the 0.5× floor, ~$142/month.

## Risks to the auction / per-panel premise

1. **Physical fulfilment cost fights the auction.** Blip and Firefly can auction because a
   digital slot turns over in seconds at zero marginal cost. A panel turnover needs a print
   run and an install. Auction cadence realistically has to be quarterly or longer — closer
   to periodic sealed-bid allocation than a live auction.
2. **Fragmented panels are a media-planning problem.** In January 2023 Wrapify, Firefly and
   mobilads standardised wraps into **180 / 270 / 360** units and **Geopath adopted the
   nomenclature**. A per-panel taxonomy runs against a measured, agency-legible standard.
   (Note the industry excluded the roof from its top tier — a signal about roof visibility.)
3. **Thin auctions clear at reserve.** With a handful of advertisers per city, most panels
   clear at the floor — an auction with extra steps and worse earnings predictability.
4. **Mixed-brand vehicles are untested** and carry brand-safety risk.
5. **Prior art:** US20140040016A1 covers auction bidding for moving-vehicle ads priced by
   location, time of day and traffic. Freedom-to-operate check needed before making the
   commute multiplier a headline claim. https://patents.google.com/patent/US20140040016A1/en
6. **Category credibility is damaged.** The FTC issued a car-wrap scam alert on 1 April 2024
   describing the "$600–$700 a week" fake-check scheme.
7. **Geographic constraints.** India likely requires RTO permission for private-vehicle
   advertising; UAE requires RTA permits; the UK category has failed twice with funding.

## Positioning

The defensible claim is **not** "we invented the auction" — Firefly already auctions digital
tops, and Blip Billboards runs a true real-time auction for digital billboards. It is:

> *the first self-serve, price-transparent way to buy physical vehicle advertising, priced
> by the panel and by where the car actually drives.*

Self-serve CPQ and panel-level pricing are real, verifiable, unoccupied gaps. The auction is
best framed as the pricing engine underneath, stress-tested for thin demand.

## Key sources

- Solomon Partners 2025 Major Media CPM Comparison (OAAA, Jun 2025) — https://oaaa.org/wp-content/uploads/2025/06/2025-Solomon-Partners-US-Core-Media-CPM-Comparison.pdf
- Vehicle wrap standardisation 180/270/360 (Jan 2023) — https://www.globenewswire.com/news-release/2023/01/11/2587164/0/en/Mobility-Advertising-Introduces-Vehicle-Wrap-Standardization-to-the-Out-of-Home-Advertising-Industry.html
- Marketing Brew, "Deals on wheels" (Jul 2021) — https://www.marketingbrew.com/stories/2021/07/30/deals-wheels-rideshare-cars-sport-ooh-ads
- Carvertise drivers — https://carvertise.com/drivers/
- Wrapify drivers — https://wrapify.com/drive/
- Firefly advertising solutions — https://www.fireflyon.com/advertising-solutions
- Good Traffic drivers — https://www.goodtraffic.com/drivers/
- Blip Billboards self-serve auction — https://www.blipbillboards.com/self-serve/
- The Rideshare Guy — Wrapify experience (Jul 2023) — https://therideshareguy.com/wrapify-experience/
- SideHusl — Carvertise (Mar 2025) — https://sidehusl.com/carvertise/
- FTC car wrap scam alert (Apr 2024) — https://consumer.ftc.gov/consumer-alerts/2024/03/how-avoid-getting-wrapped-car-wrap-scam
- Aluko Vinyl 2025 wrap cost guide — https://blog.alukovinyl.com/vehicle-wrap-cost-guide-2025-pricing-for-cars-trucks-suvs-commercial-vehicles/
- Kiwibot acquires Nickelytics (Sep 2024) — https://techcrunch.com/2024/09/19/kiwibot-acquires-ad-startup-to-turn-its-delivery-robots-into-mobile-billboards
- Companies House — Adverttu insolvency — https://find-and-update.company-information.service.gov.uk/company/09861126/insolvency
- MyHoardings — India private-car advertising legality — https://www.myhoardings.com/ads/is-it-legal-to-use-private-cars-for-advertising-in-india/
