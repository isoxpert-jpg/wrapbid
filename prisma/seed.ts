import 'dotenv/config'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { computeCosts } from '../src/lib/costs'
import { computeExposure } from '../src/lib/pricing'
import { renderAgreement } from '../src/lib/agreementTemplate'
import { startingRentCents } from '../src/lib/pricing'

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
})

const DEMO_PASSWORD = 'demo1234'

/** Panel rate card. Sizes are typical usable flat areas, in centimetres. */
const PANEL_TYPES = [
  { code: 'REAR_WINDSHIELD', label: 'Rear windshield', baseRateCents: 9000, widthCm: 120, heightCm: 45, sortOrder: 1 },
  { code: 'DRIVER_DOOR', label: 'Driver door', baseRateCents: 8000, widthCm: 100, heightCm: 45, sortOrder: 2 },
  { code: 'TAILGATE', label: 'Tailgate / trunk', baseRateCents: 7000, widthCm: 110, heightCm: 40, sortOrder: 3 },
  { code: 'PASSENGER_DOOR', label: 'Passenger door', baseRateCents: 6500, widthCm: 100, heightCm: 45, sortOrder: 4 },
  { code: 'REAR_QUARTER', label: 'Rear quarter window', baseRateCents: 4500, widthCm: 50, heightCm: 35, sortOrder: 5 },
  { code: 'HOOD', label: 'Hood', baseRateCents: 4000, widthCm: 120, heightCm: 60, sortOrder: 6 },
  { code: 'ROOF', label: 'Roof', baseRateCents: 2500, widthCm: 100, heightCm: 80, sortOrder: 7 },
]

/** Stands in for a geocoding API — the commute form is a city picker. */
const CITIES = [
  { name: 'Austin', region: 'TX', lat: 30.2672, lng: -97.7431, defaultArea: 'URBAN' },
  { name: 'Round Rock', region: 'TX', lat: 30.5083, lng: -97.6789, defaultArea: 'SUBURBAN' },
  { name: 'San Marcos', region: 'TX', lat: 29.8833, lng: -97.9414, defaultArea: 'SUBURBAN' },
  { name: 'Dallas', region: 'TX', lat: 32.7767, lng: -96.797, defaultArea: 'URBAN_CORE' },
  { name: 'Plano', region: 'TX', lat: 33.0198, lng: -96.6989, defaultArea: 'SUBURBAN' },
  { name: 'Houston', region: 'TX', lat: 29.7604, lng: -95.3698, defaultArea: 'URBAN_CORE' },
  { name: 'Sugar Land', region: 'TX', lat: 29.6197, lng: -95.6349, defaultArea: 'SUBURBAN' },
  { name: 'Chicago', region: 'IL', lat: 41.8781, lng: -87.6298, defaultArea: 'URBAN_CORE' },
  { name: 'Evanston', region: 'IL', lat: 42.0451, lng: -87.6877, defaultArea: 'URBAN' },
  { name: 'Naperville', region: 'IL', lat: 41.7508, lng: -88.1535, defaultArea: 'SUBURBAN' },
  { name: 'New York', region: 'NY', lat: 40.7128, lng: -74.006, defaultArea: 'URBAN_CORE' },
  { name: 'Newark', region: 'NJ', lat: 40.7357, lng: -74.1724, defaultArea: 'URBAN' },
  { name: 'Jersey City', region: 'NJ', lat: 40.7178, lng: -74.0431, defaultArea: 'URBAN' },
  { name: 'Los Angeles', region: 'CA', lat: 34.0522, lng: -118.2437, defaultArea: 'URBAN_CORE' },
  { name: 'Santa Monica', region: 'CA', lat: 34.0195, lng: -118.4912, defaultArea: 'URBAN' },
  { name: 'Pasadena', region: 'CA', lat: 34.1478, lng: -118.1445, defaultArea: 'URBAN' },
  { name: 'Long Beach', region: 'CA', lat: 33.7701, lng: -118.1937, defaultArea: 'URBAN' },
  { name: 'Irvine', region: 'CA', lat: 33.6846, lng: -117.8265, defaultArea: 'SUBURBAN' },
  { name: 'San Francisco', region: 'CA', lat: 37.7749, lng: -122.4194, defaultArea: 'URBAN_CORE' },
  { name: 'Oakland', region: 'CA', lat: 37.8044, lng: -122.2712, defaultArea: 'URBAN' },
  { name: 'San Jose', region: 'CA', lat: 37.3382, lng: -121.8863, defaultArea: 'URBAN' },
  { name: 'Palo Alto', region: 'CA', lat: 37.4419, lng: -122.143, defaultArea: 'SUBURBAN' },
  { name: 'Seattle', region: 'WA', lat: 47.6062, lng: -122.3321, defaultArea: 'URBAN_CORE' },
  { name: 'Bellevue', region: 'WA', lat: 47.6101, lng: -122.2015, defaultArea: 'URBAN' },
  { name: 'Tacoma', region: 'WA', lat: 47.2529, lng: -122.4443, defaultArea: 'SUBURBAN' },
  { name: 'Denver', region: 'CO', lat: 39.7392, lng: -104.9903, defaultArea: 'URBAN' },
  { name: 'Boulder', region: 'CO', lat: 40.015, lng: -105.2705, defaultArea: 'SUBURBAN' },
  { name: 'Phoenix', region: 'AZ', lat: 33.4484, lng: -112.074, defaultArea: 'URBAN' },
  { name: 'Scottsdale', region: 'AZ', lat: 33.4942, lng: -111.9261, defaultArea: 'SUBURBAN' },
  { name: 'Atlanta', region: 'GA', lat: 33.749, lng: -84.388, defaultArea: 'URBAN_CORE' },
  { name: 'Marietta', region: 'GA', lat: 33.9526, lng: -84.5499, defaultArea: 'SUBURBAN' },
  { name: 'Miami', region: 'FL', lat: 25.7617, lng: -80.1918, defaultArea: 'URBAN_CORE' },
  { name: 'Fort Lauderdale', region: 'FL', lat: 26.1224, lng: -80.1373, defaultArea: 'URBAN' },
  { name: 'Orlando', region: 'FL', lat: 28.5383, lng: -81.3792, defaultArea: 'URBAN' },
  { name: 'Boston', region: 'MA', lat: 42.3601, lng: -71.0589, defaultArea: 'URBAN_CORE' },
  { name: 'Cambridge', region: 'MA', lat: 42.3736, lng: -71.1097, defaultArea: 'URBAN' },
  { name: 'Nashville', region: 'TN', lat: 36.1627, lng: -86.7816, defaultArea: 'URBAN' },
  { name: 'Portland', region: 'OR', lat: 45.5152, lng: -122.6784, defaultArea: 'URBAN' },
  { name: 'Minneapolis', region: 'MN', lat: 44.9778, lng: -93.265, defaultArea: 'URBAN' },
  { name: 'Bloomington', region: 'MN', lat: 44.8408, lng: -93.2983, defaultArea: 'SUBURBAN' },
  { name: 'Karachi', region: 'Sindh, Pakistan', lat: 24.8607, lng: 67.0011, defaultArea: 'URBAN_CORE' },
  { name: 'Lahore', region: 'Punjab, Pakistan', lat: 31.5204, lng: 74.3587, defaultArea: 'URBAN_CORE' },
  { name: 'Islamabad', region: 'Islamabad, Pakistan', lat: 33.6844, lng: 73.0479, defaultArea: 'URBAN' },
  { name: 'Rawalpindi', region: 'Punjab, Pakistan', lat: 33.5651, lng: 73.0169, defaultArea: 'URBAN' },
  { name: 'Peshawar', region: 'Khyber Pakhtunkhwa, Pakistan', lat: 34.0151, lng: 71.5249, defaultArea: 'URBAN' },
  { name: 'Quetta', region: 'Balochistan, Pakistan', lat: 30.1798, lng: 66.975, defaultArea: 'URBAN' },
  { name: 'Kabul', region: 'Kabul, Afghanistan', lat: 34.5553, lng: 69.2075, defaultArea: 'URBAN_CORE' },
  { name: 'Herat', region: 'Herat, Afghanistan', lat: 34.3529, lng: 62.204, defaultArea: 'URBAN' },
  { name: 'Jalalabad', region: 'Nangarhar, Afghanistan', lat: 34.4342, lng: 70.4478, defaultArea: 'URBAN' },
  { name: 'Kandahar', region: 'Kandahar, Afghanistan', lat: 31.6289, lng: 65.7372, defaultArea: 'URBAN' },
  { name: 'Mazar-i-Sharif', region: 'Balkh, Afghanistan', lat: 36.7069, lng: 67.1122, defaultArea: 'URBAN' },
]

const city = (name: string) => {
  const c = CITIES.find((x) => x.name === name)
  if (!c) throw new Error(`Unknown seed city: ${name}`)
  return c
}

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000)
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000)

async function main() {
  console.log('Clearing existing data…')
  // Order matters: children before parents.
  await prisma.qrScan.deleteMany()
  await prisma.installation.deleteMany()
  await prisma.agreement.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.creative.deleteMany()
  await prisma.campaignPanelTarget.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.product.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.panelListing.deleteMany()
  await prisma.panelCalibration.deleteMany()
  await prisma.vehiclePhoto.deleteMany()
  await prisma.commuteProfile.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.ledgerEntry.deleteMany()
  await prisma.user.deleteMany()
  await prisma.panelType.deleteMany()
  await prisma.city.deleteMany()

  console.log('Seeding reference data…')
  await prisma.panelType.createMany({ data: PANEL_TYPES })
  await prisma.city.createMany({ data: CITIES })

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  console.log('Seeding users…')
  const admin = await prisma.user.create({
    data: { email: 'admin@wrapbid.test', passwordHash, name: 'Ops Admin', role: 'ADMIN' },
  })

  const driverSpecs = [
    {
      email: 'driver.maya@wrapbid.test',
      name: 'Maya Okonkwo',
      phone: '+1 512 555 0142',
      vehicle: { make: 'Toyota', model: 'Corolla', year: 2021, color: 'White', colorHex: '#f2f2f2', bodyType: 'SEDAN', plate: 'TX 8UJ 4821' },
      // Short dense-city hop — low mileage, high density. Should land BELOW 1.0.
      commute: { home: 'Cambridge', work: 'Boston', days: 5, area: 'URBAN_CORE', parking: 'STREET_BUSY' },
      condition: 5,
    },
    {
      email: 'driver.diego@wrapbid.test',
      name: 'Diego Ramírez',
      phone: '+1 312 555 0198',
      vehicle: { make: 'Honda', model: 'CR-V', year: 2019, color: 'Graphite', colorHex: '#3a3f45', bodyType: 'SUV', plate: 'IL 4RT 9930' },
      // Classic suburb-to-core commute — the model's mid case, near 1.5.
      commute: { home: 'Pasadena', work: 'Los Angeles', days: 5, area: 'URBAN', parking: 'STREET_BUSY' },
      condition: 4,
    },
    {
      email: 'driver.sam@wrapbid.test',
      name: 'Sam Whitfield',
      phone: '+1 720 555 0177',
      vehicle: { make: 'Ford', model: 'F-150', year: 2016, color: 'Blue', colorHex: '#1e3a8a', bodyType: 'PICKUP', plate: 'CO 2LM 7715' },
      commute: { home: 'Boulder', work: 'Denver', days: 4, area: 'SUBURBAN', parking: 'GARAGE' },
      condition: 3,
    },
    {
      email: 'driver.ali@wrapbid.test', name: 'Ali Raza', phone: '+92 300 555 0142',
      vehicle: { make: 'Suzuki', model: 'Alto', year: 2020, color: 'White', colorHex: '#eeeeea', bodyType: 'HATCHBACK', plate: 'LEA-2046' },
      commute: { home: 'Rawalpindi', work: 'Islamabad', days: 6, area: 'URBAN', parking: 'LOT' }, condition: 4,
    },
    {
      email: 'driver.farid@wrapbid.test', name: 'Farid Ahmadi', phone: '+93 70 555 0142',
      vehicle: { make: 'Toyota', model: 'Corolla', year: 2012, color: 'Silver', colorHex: '#bfc2c3', bodyType: 'SEDAN', plate: 'KBL-5821' },
      commute: { home: 'Kabul', work: 'Kabul', days: 6, area: 'URBAN_CORE', parking: 'STREET_BUSY' }, condition: 3,
    },
  ]

  const drivers = []
  for (const spec of driverSpecs) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        passwordHash,
        name: spec.name,
        phone: spec.phone,
        role: 'DRIVER',
      },
    })

    const home = city(spec.commute.home)
    const work = city(spec.commute.work)
    const exposure = computeExposure({
      home: { lat: home.lat, lng: home.lng },
      work: { lat: work.lat, lng: work.lng },
      commuteDaysPerWeek: spec.commute.days,
      areaType: spec.commute.area as never,
      parkingType: spec.commute.parking as never,
    })

    const vehicle = await prisma.vehicle.create({
      data: {
        driverId: user.id,
        make: spec.vehicle.make,
        model: spec.vehicle.model,
        year: spec.vehicle.year,
        color: spec.vehicle.color,
        bodyType: spec.vehicle.bodyType,
        plateNumber: spec.vehicle.plate,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        conditionRating: spec.condition,
        commute: {
          create: {
            homeLabel: `${home.name}, ${home.region}`,
            homeLat: home.lat,
            homeLng: home.lng,
            workLabel: `${work.name}, ${work.region}`,
            workLat: work.lat,
            workLng: work.lng,
            commuteDaysPerWeek: spec.commute.days,
            areaType: spec.commute.area,
            parkingType: spec.commute.parking,
            straightLineKm: exposure.straightLineKm,
            roadKm: exposure.roadKm,
            monthlyKm: exposure.monthlyKm,
            estMonthlyImpressions: exposure.estMonthlyImpressions,
            exposureScore: exposure.exposureScore,
          },
        },
      },
      include: { commute: true },
    })

    drivers.push({ user, vehicle, exposure, colorHex: spec.vehicle.colorHex })
    console.log(
      `  ${spec.name}: ${exposure.roadKm}km each way, exposure ${exposure.exposureScore}, ` +
        `${exposure.estMonthlyImpressions.toLocaleString()} impressions/mo`,
    )
  }

  console.log('Seeding listings…')
  const panelByCode = Object.fromEntries(PANEL_TYPES.map((p) => [p.code, p]))

  /** [driverIndex, panelCode, termMonths, auctionEndsAt] */
  const listingSpecs: [number, string, number, Date][] = [
    [0, 'REAR_WINDSHIELD', 3, minutesFromNow(2)], // ends almost immediately — demoable
    [0, 'DRIVER_DOOR', 6, daysFromNow(3)],
    [0, 'TAILGATE', 3, daysFromNow(5)],
    [1, 'REAR_WINDSHIELD', 6, daysFromNow(2)],
    [1, 'PASSENGER_DOOR', 3, daysFromNow(4)],
    [1, 'ROOF', 12, daysFromNow(6)],
    [2, 'TAILGATE', 6, daysFromNow(1)],
    [2, 'HOOD', 3, daysFromNow(7)],
    [2, 'REAR_QUARTER', 3, daysFromNow(4)],
    [3, 'DRIVER_DOOR', 3, daysFromNow(3)],
    [3, 'REAR_WINDSHIELD', 3, daysFromNow(5)],
    [4, 'DRIVER_DOOR', 3, daysFromNow(4)],
    [4, 'TAILGATE', 3, daysFromNow(6)],
  ]

  const listings = []
  for (const [driverIdx, code, termMonths, endsAt] of listingSpecs) {
    const d = drivers[driverIdx]
    const panel = panelByCode[code]
    const rent = startingRentCents(panel.baseRateCents, d.exposure.exposureScore)

    const listing = await prisma.panelListing.create({
      data: {
        vehicleId: d.vehicle.id,
        panelTypeCode: code,
        status: 'ACTIVE',
        startingRentCents: rent,
        currentRentCents: rent,
        termMonths,
        baseRateSnapshotCents: panel.baseRateCents,
        exposureSnapshot: d.exposure.exposureScore,
        auctionEndsAt: endsAt,
      },
    })
    listings.push(listing)
  }

  console.log('Seeding brands, products, advertisers and campaigns…')
  const advertiserSpecs = [
    {
      email: 'ads.brightbrew@wrapbid.test',
      name: 'Priya Nair',
      company: 'BrightBrew Coffee',
      slug: 'brightbrew-coffee',
      industry: 'Food & beverage',
      brandDescription:
        'Small-batch specialty coffee roaster with eight cafés across central Texas.',
      website: 'https://example.com/brightbrew',
      brandStatus: 'APPROVED',
      product: {
        name: 'Cold Brew 12-pack',
        description:
          'Ready-to-drink cold brew in recyclable cans, sold in supermarkets and online.',
        category: 'Food & beverage',
        priceCents: 2_400,
        targetAudience: 'Commuters aged 25–45 who buy coffee on the way to work',
        hex: '#c2410c',
        widthPx: 2400,
        heightPx: 2400,
      },
      target: 'Boston',
      radius: 40,
      budget: 400_000,
      landing: 'https://example.com/brightbrew',
      creatives: [
        { fileName: 'brightbrew-hero.png', widthPx: 4200, heightPx: 1600, hex: '#c2410c' },
        { fileName: 'brightbrew-lowres.png', widthPx: 480, heightPx: 200, hex: '#c2410c' },
      ],
    },
    {
      email: 'ads.northgear@wrapbid.test',
      name: 'Tom Alvarez',
      company: 'NorthGear Outdoors',
      slug: 'northgear-outdoors',
      industry: 'Retail',
      brandDescription:
        'Outdoor equipment retailer specialising in hiking and cold-weather gear.',
      website: 'https://example.com/northgear',
      brandStatus: 'APPROVED',
      product: {
        name: 'Summit 40L Backpack',
        description: 'Weatherproof 40-litre trekking pack with an aluminium frame.',
        category: 'Outdoor & sports',
        priceCents: 18_900,
        targetAudience: 'Weekend hikers and commuters who cycle or walk part-way',
        hex: '#065f46',
        widthPx: 2000,
        heightPx: 2000,
      },
      target: 'Los Angeles',
      radius: 45,
      budget: 650_000,
      landing: 'https://example.com/northgear',
      creatives: [{ fileName: 'northgear-logo.png', widthPx: 5000, heightPx: 1800, hex: '#065f46' }],
    },
  ]

  const advertisers = []
  for (const spec of advertiserSpecs) {
    const user = await prisma.user.create({
      data: { email: spec.email, passwordHash, name: spec.name, role: 'ADVERTISER' },
    })
    const target = city(spec.target)

    const brand = await prisma.brand.create({
      data: {
        ownerId: user.id,
        name: spec.company,
        slug: spec.slug,
        industry: spec.industry,
        description: spec.brandDescription,
        website: spec.website,
        contactEmail: spec.email,
        logoPath: `/api/placeholder/${encodeURIComponent(spec.company)}/${spec.product.hex.slice(1)}`,
        status: spec.brandStatus,
        reviewedAt: new Date(),
      },
    })

    const product = await prisma.product.create({
      data: {
        brandId: brand.id,
        name: spec.product.name,
        description: spec.product.description,
        category: spec.product.category,
        imagePath: `/api/placeholder/${encodeURIComponent(spec.product.name)}/${spec.product.hex.slice(1)}`,
        imageWidthPx: spec.product.widthPx,
        imageHeightPx: spec.product.heightPx,
        dominantHex: spec.product.hex,
        priceCents: spec.product.priceCents,
        targetAudience: spec.product.targetAudience,
      },
    })

    const campaign = await prisma.campaign.create({
      data: {
        advertiserId: user.id,
        brandId: brand.id,
        productId: product.id,
        name: `${spec.product.name} — commuter push`,
        budgetCents: spec.budget,
        targetLabel: `${target.name}, ${target.region}`,
        targetLat: target.lat,
        targetLng: target.lng,
        targetRadiusKm: spec.radius,
        productCategory: spec.product.category,
        landingUrl: spec.landing,
        status: 'ACTIVE',
        startsAt: new Date(),
        endsAt: daysFromNow(180),
        panelTargets: {
          create: [
            { panelTypeCode: 'REAR_WINDSHIELD' },
            { panelTypeCode: 'TAILGATE' },
            { panelTypeCode: 'DRIVER_DOOR' },
          ],
        },
        creatives: {
          create: spec.creatives.map((c, i) => ({
            fileName: c.fileName,
            // Placeholder artwork generated at request time by /api/placeholder —
            // no binary assets are checked into the repo.
            filePath: `/api/placeholder/${encodeURIComponent(spec.company)}/${c.hex.slice(1)}`,
            mimeType: 'image/svg+xml',
            widthPx: c.widthPx,
            heightPx: c.heightPx,
            dominantHex: c.hex,
            isPrimary: i === 0,
          })),
        },
      },
      include: { creatives: true },
    })

    advertisers.push({ user, campaign })
  }

  console.log('Seeding bids…')
  const bump = (base: number, pct: number) => Math.round(base * (1 + pct))

  // A contested listing: both advertisers bid it up in turn.
  const contested = listings[3] // Diego's rear windshield
  await prisma.bid.create({
    data: {
      listingId: contested.id,
      campaignId: advertisers[1].campaign.id,
      advertiserId: advertisers[1].user.id,
      creativeId: advertisers[1].campaign.creatives[0].id,
      monthlyAmountCents: bump(contested.startingRentCents, 0.08),
      status: 'OUTBID',
    },
  })
  await prisma.bid.create({
    data: {
      listingId: contested.id,
      campaignId: advertisers[0].campaign.id,
      advertiserId: advertisers[0].user.id,
      creativeId: advertisers[0].campaign.creatives[0].id,
      monthlyAmountCents: bump(contested.startingRentCents, 0.17),
      status: 'OUTBID',
    },
  })
  const topBid = await prisma.bid.create({
    data: {
      listingId: contested.id,
      campaignId: advertisers[1].campaign.id,
      advertiserId: advertisers[1].user.id,
      creativeId: advertisers[1].campaign.creatives[0].id,
      monthlyAmountCents: bump(contested.startingRentCents, 0.29),
      status: 'ACTIVE',
    },
  })
  await prisma.panelListing.update({
    where: { id: contested.id },
    data: { currentRentCents: topBid.monthlyAmountCents },
  })

  // A few uncontested opening bids elsewhere.
  for (const [idx, advIdx, pct] of [
    [1, 0, 0.05],
    [4, 1, 0.1],
    [6, 0, 0.06],
  ] as const) {
    const l = listings[idx]
    const adv = advertisers[advIdx]
    const amount = bump(l.startingRentCents, pct)
    await prisma.bid.create({
      data: {
        listingId: l.id,
        campaignId: adv.campaign.id,
        advertiserId: adv.user.id,
        creativeId: adv.campaign.creatives[0].id,
        monthlyAmountCents: amount,
        status: 'ACTIVE',
      },
    })
    await prisma.panelListing.update({
      where: { id: l.id },
      data: { currentRentCents: amount },
    })
  }

  console.log('Seeding a completed deal (agreement + installation)…')
  const doneDriver = drivers[2]
  const doneAdv = advertisers[1]
  const donePanel = panelByCode.DRIVER_DOOR
  const doneRent = startingRentCents(donePanel.baseRateCents, doneDriver.exposure.exposureScore)
  const doneTerm = 6

  const doneListing = await prisma.panelListing.create({
    data: {
      vehicleId: doneDriver.vehicle.id,
      panelTypeCode: 'DRIVER_DOOR',
      status: 'SOLD',
      startingRentCents: doneRent,
      currentRentCents: doneRent,
      termMonths: doneTerm,
      baseRateSnapshotCents: donePanel.baseRateCents,
      exposureSnapshot: doneDriver.exposure.exposureScore,
      auctionEndsAt: daysFromNow(-2),
    },
  })

  const doneBid = await prisma.bid.create({
    data: {
      listingId: doneListing.id,
      campaignId: doneAdv.campaign.id,
      advertiserId: doneAdv.user.id,
      creativeId: doneAdv.campaign.creatives[0].id,
      monthlyAmountCents: doneRent,
      status: 'WON',
    },
  })
  await prisma.panelListing.update({
    where: { id: doneListing.id },
    data: { winningBidId: doneBid.id },
  })

  const costs = computeCosts({
    monthlyRentCents: doneRent,
    termMonths: doneTerm,
    panelWidthCm: donePanel.widthCm,
    panelHeightCm: donePanel.heightCm,
  })

  const startDate = new Date()
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + doneTerm)

  const body = renderAgreement({
    driverName: doneDriver.user.name,
    driverPhone: doneDriver.user.phone,
    advertiserName: doneAdv.user.name,
    campaignName: doneAdv.campaign.name,
    vehicle: `${doneDriver.vehicle.year} ${doneDriver.vehicle.make} ${doneDriver.vehicle.model} (${doneDriver.vehicle.color})`,
    plateMasked: '••• 7715',
    panelLabel: donePanel.label,
    panelWidthCm: donePanel.widthCm,
    panelHeightCm: donePanel.heightCm,
    monthlyRentCents: doneRent,
    termMonths: doneTerm,
    totalValueCents: costs.totalValueCents,
    driverPayoutCents: costs.driverPayoutCents,
    startDate,
    endDate,
    creativeName: doneAdv.campaign.creatives[0].fileName,
  })

  const agreement = await prisma.agreement.create({
    data: {
      listingId: doneListing.id,
      driverId: doneDriver.user.id,
      advertiserId: doneAdv.user.id,
      campaignId: doneAdv.campaign.id,
      creativeId: doneAdv.campaign.creatives[0].id,
      monthlyRentCents: doneRent,
      termMonths: doneTerm,
      totalValueCents: costs.totalValueCents,
      startDate,
      endDate,
      driverPayoutCents: costs.driverPayoutCents,
      printCostCents: costs.printCostCents,
      shippingCostCents: costs.shippingCostCents,
      processingFeeCents: costs.processingFeeCents,
      platformMarginCents: costs.platformMarginCents,
      status: 'ACTIVE',
      driverSignedAt: new Date(),
      driverSignedName: doneDriver.user.name,
      advertiserSignedAt: new Date(),
      advertiserSignedName: doneAdv.user.name,
      bodyMarkdown: body,
    },
  })

  const installation = await prisma.installation.create({
    data: {
      listingId: doneListing.id,
      agreementId: agreement.id,
      qrSlug: 'demo-northgear-door',
      status: 'INSTALLED',
      installedAt: daysFromNow(-1),
    },
  })

  // A handful of scans so the QR analytics aren't empty on first load.
  for (let i = 0; i < 7; i++) {
    await prisma.qrScan.create({
      data: {
        installationId: installation.id,
        scannedAt: new Date(Date.now() - i * 3_600_000),
        userAgent: 'Mozilla/5.0 (seed)',
      },
    })
  }

  // A second deal left awaiting signatures, so that flow is visible too.
  const pendingDriver = drivers[1]
  const pendingPanel = panelByCode.TAILGATE
  const pendingRent = startingRentCents(
    pendingPanel.baseRateCents,
    pendingDriver.exposure.exposureScore,
  )
  const pendingTerm = 3
  const pendingListing = await prisma.panelListing.create({
    data: {
      vehicleId: pendingDriver.vehicle.id,
      panelTypeCode: 'TAILGATE',
      status: 'SOLD',
      startingRentCents: pendingRent,
      currentRentCents: pendingRent,
      termMonths: pendingTerm,
      baseRateSnapshotCents: pendingPanel.baseRateCents,
      exposureSnapshot: pendingDriver.exposure.exposureScore,
      auctionEndsAt: daysFromNow(-1),
    },
  })
  const pendingBid = await prisma.bid.create({
    data: {
      listingId: pendingListing.id,
      campaignId: advertisers[0].campaign.id,
      advertiserId: advertisers[0].user.id,
      creativeId: advertisers[0].campaign.creatives[0].id,
      monthlyAmountCents: pendingRent,
      status: 'WON',
    },
  })
  await prisma.panelListing.update({
    where: { id: pendingListing.id },
    data: { winningBidId: pendingBid.id },
  })

  const pendingCosts = computeCosts({
    monthlyRentCents: pendingRent,
    termMonths: pendingTerm,
    panelWidthCm: pendingPanel.widthCm,
    panelHeightCm: pendingPanel.heightCm,
  })
  const pStart = new Date()
  const pEnd = new Date(pStart)
  pEnd.setMonth(pEnd.getMonth() + pendingTerm)

  const pendingAgreement = await prisma.agreement.create({
    data: {
      listingId: pendingListing.id,
      driverId: pendingDriver.user.id,
      advertiserId: advertisers[0].user.id,
      campaignId: advertisers[0].campaign.id,
      creativeId: advertisers[0].campaign.creatives[0].id,
      monthlyRentCents: pendingRent,
      termMonths: pendingTerm,
      totalValueCents: pendingCosts.totalValueCents,
      startDate: pStart,
      endDate: pEnd,
      driverPayoutCents: pendingCosts.driverPayoutCents,
      printCostCents: pendingCosts.printCostCents,
      shippingCostCents: pendingCosts.shippingCostCents,
      processingFeeCents: pendingCosts.processingFeeCents,
      platformMarginCents: pendingCosts.platformMarginCents,
      status: 'AWAITING_SIGNATURES',
      advertiserSignedAt: new Date(),
      advertiserSignedName: advertisers[0].user.name,
      bodyMarkdown: renderAgreement({
        driverName: pendingDriver.user.name,
        driverPhone: pendingDriver.user.phone,
        advertiserName: advertisers[0].user.name,
        campaignName: advertisers[0].campaign.name,
        vehicle: `${pendingDriver.vehicle.year} ${pendingDriver.vehicle.make} ${pendingDriver.vehicle.model} (${pendingDriver.vehicle.color})`,
        plateMasked: '••• 9930',
        panelLabel: pendingPanel.label,
        panelWidthCm: pendingPanel.widthCm,
        panelHeightCm: pendingPanel.heightCm,
        monthlyRentCents: pendingRent,
        termMonths: pendingTerm,
        totalValueCents: pendingCosts.totalValueCents,
        driverPayoutCents: pendingCosts.driverPayoutCents,
        startDate: pStart,
        endDate: pEnd,
        creativeName: advertisers[0].campaign.creatives[0].fileName,
      }),
    },
  })

  await prisma.installation.create({
    data: {
      listingId: pendingListing.id,
      agreementId: pendingAgreement.id,
      qrSlug: 'demo-brightbrew-tailgate',
      status: 'BLOCKED_UNSIGNED',
    },
  })

  console.log(`
Seed complete.

  Admin        admin@wrapbid.test
  Drivers      ${driverSpecs.map((d) => d.email).join('\n               ')}
  Advertisers  ${advertiserSpecs.map((a) => a.email).join('\n               ')}
  Password     ${DEMO_PASSWORD}

  One auction (Maya's rear windshield) ends ~2 minutes from now so you can watch
  it resolve. Admin ${admin.email} can force it from /admin.
`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
