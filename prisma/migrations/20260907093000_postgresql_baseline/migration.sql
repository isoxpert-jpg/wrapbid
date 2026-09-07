-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverTermsAcceptedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "plateNumber" TEXT,
    "plateHash" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "conditionRating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelCalibration" (
    "id" TEXT NOT NULL,
    "vehiclePhotoId" TEXT NOT NULL,
    "panelTypeCode" TEXT NOT NULL,
    "x1" DOUBLE PRECISION NOT NULL,
    "y1" DOUBLE PRECISION NOT NULL,
    "x2" DOUBLE PRECISION NOT NULL,
    "y2" DOUBLE PRECISION NOT NULL,
    "x3" DOUBLE PRECISION NOT NULL,
    "y3" DOUBLE PRECISION NOT NULL,
    "x4" DOUBLE PRECISION NOT NULL,
    "y4" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PanelCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommuteProfile" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "homeLabel" TEXT NOT NULL,
    "homeLat" DOUBLE PRECISION NOT NULL,
    "homeLng" DOUBLE PRECISION NOT NULL,
    "workLabel" TEXT NOT NULL,
    "workLat" DOUBLE PRECISION NOT NULL,
    "workLng" DOUBLE PRECISION NOT NULL,
    "commuteDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "areaType" TEXT NOT NULL,
    "parkingType" TEXT NOT NULL,
    "straightLineKm" DOUBLE PRECISION NOT NULL,
    "roadKm" DOUBLE PRECISION NOT NULL,
    "monthlyKm" DOUBLE PRECISION NOT NULL,
    "estMonthlyImpressions" INTEGER NOT NULL,
    "exposureScore" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "routeConfidence" TEXT NOT NULL DEFAULT 'DECLARED',

    CONSTRAINT "CommuteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanelType" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "baseRateCents" INTEGER NOT NULL,
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "PanelType_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "PanelListing" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "panelTypeCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startingRentCents" INTEGER NOT NULL,
    "reserveRentCents" INTEGER,
    "currentRentCents" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL DEFAULT 3,
    "baseRateSnapshotCents" INTEGER NOT NULL,
    "exposureSnapshot" DOUBLE PRECISION NOT NULL,
    "auctionEndsAt" TIMESTAMP(3) NOT NULL,
    "winningBidId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PanelListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoPath" TEXT,
    "website" TEXT,
    "industry" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imagePath" TEXT,
    "imageWidthPx" INTEGER,
    "imageHeightPx" INTEGER,
    "dominantHex" TEXT,
    "priceCents" INTEGER,
    "targetAudience" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "brandId" TEXT,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "budgetCents" INTEGER NOT NULL,
    "spentCents" INTEGER NOT NULL DEFAULT 0,
    "targetLabel" TEXT NOT NULL,
    "targetLat" DOUBLE PRECISION NOT NULL,
    "targetLng" DOUBLE PRECISION NOT NULL,
    "targetRadiusKm" DOUBLE PRECISION NOT NULL,
    "productCategory" TEXT,
    "landingUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignPanelTarget" (
    "campaignId" TEXT NOT NULL,
    "panelTypeCode" TEXT NOT NULL,

    CONSTRAINT "CampaignPanelTarget_pkey" PRIMARY KEY ("campaignId","panelTypeCode")
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "dominantHex" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Creative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativePlacement" (
    "id" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "offsetX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offsetY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreativePlacement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "monthlyAmountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "monthlyRentCents" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "totalValueCents" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "driverPayoutCents" INTEGER NOT NULL,
    "printCostCents" INTEGER NOT NULL,
    "shippingCostCents" INTEGER NOT NULL,
    "processingFeeCents" INTEGER NOT NULL,
    "platformMarginCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_SIGNATURES',
    "driverSignedAt" TIMESTAMP(3),
    "driverSignedName" TEXT,
    "advertiserSignedAt" TIMESTAMP(3),
    "advertiserSignedName" TEXT,
    "bodyMarkdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "qrSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BLOCKED_UNSIGNED',
    "installedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCheck" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "challengeCode" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "VerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationProof" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "photoPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewNotes" TEXT,

    CONSTRAINT "InstallationProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "bidId" TEXT,
    "type" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrScan" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,

    CONSTRAINT "QrScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "agreementId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "defaultArea" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateHash_key" ON "Vehicle"("plateHash");

-- CreateIndex
CREATE INDEX "Vehicle_driverId_idx" ON "Vehicle"("driverId");

-- CreateIndex
CREATE INDEX "Vehicle_verificationStatus_idx" ON "Vehicle"("verificationStatus");

-- CreateIndex
CREATE INDEX "VehiclePhoto_vehicleId_view_idx" ON "VehiclePhoto"("vehicleId", "view");

-- CreateIndex
CREATE UNIQUE INDEX "PanelCalibration_vehiclePhotoId_panelTypeCode_key" ON "PanelCalibration"("vehiclePhotoId", "panelTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "CommuteProfile_vehicleId_key" ON "CommuteProfile"("vehicleId");

-- CreateIndex
CREATE INDEX "PanelListing_status_auctionEndsAt_idx" ON "PanelListing"("status", "auctionEndsAt");

-- CreateIndex
CREATE INDEX "PanelListing_panelTypeCode_idx" ON "PanelListing"("panelTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_ownerId_key" ON "Brand"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_status_idx" ON "Brand"("status");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Campaign_advertiserId_idx" ON "Campaign"("advertiserId");

-- CreateIndex
CREATE INDEX "Creative_campaignId_idx" ON "Creative"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativePlacement_creativeId_listingId_key" ON "CreativePlacement"("creativeId", "listingId");

-- CreateIndex
CREATE INDEX "Bid_listingId_monthlyAmountCents_idx" ON "Bid"("listingId", "monthlyAmountCents");

-- CreateIndex
CREATE INDEX "Bid_campaignId_idx" ON "Bid"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_listingId_key" ON "Agreement"("listingId");

-- CreateIndex
CREATE INDEX "Agreement_status_idx" ON "Agreement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_listingId_key" ON "Installation"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_agreementId_key" ON "Installation"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_qrSlug_key" ON "Installation"("qrSlug");

-- CreateIndex
CREATE INDEX "Installation_status_idx" ON "Installation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCheck_challengeCode_key" ON "VerificationCheck"("challengeCode");

-- CreateIndex
CREATE INDEX "VerificationCheck_installationId_status_idx" ON "VerificationCheck"("installationId", "status");

-- CreateIndex
CREATE INDEX "VerificationCheck_expiresAt_status_idx" ON "VerificationCheck"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationProof_checkId_key" ON "InstallationProof"("checkId");

-- CreateIndex
CREATE INDEX "InstallationProof_installationId_status_idx" ON "InstallationProof"("installationId", "status");

-- CreateIndex
CREATE INDEX "FraudSignal_status_riskScore_idx" ON "FraudSignal"("status", "riskScore");

-- CreateIndex
CREATE INDEX "FraudSignal_userId_createdAt_idx" ON "FraudSignal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QrScan_installationId_scannedAt_idx" ON "QrScan"("installationId", "scannedAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_periodMonth_idx" ON "LedgerEntry"("userId", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_region_key" ON "City"("name", "region");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelCalibration" ADD CONSTRAINT "PanelCalibration_vehiclePhotoId_fkey" FOREIGN KEY ("vehiclePhotoId") REFERENCES "VehiclePhoto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelCalibration" ADD CONSTRAINT "PanelCalibration_panelTypeCode_fkey" FOREIGN KEY ("panelTypeCode") REFERENCES "PanelType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommuteProfile" ADD CONSTRAINT "CommuteProfile_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelListing" ADD CONSTRAINT "PanelListing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PanelListing" ADD CONSTRAINT "PanelListing_panelTypeCode_fkey" FOREIGN KEY ("panelTypeCode") REFERENCES "PanelType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPanelTarget" ADD CONSTRAINT "CampaignPanelTarget_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignPanelTarget" ADD CONSTRAINT "CampaignPanelTarget_panelTypeCode_fkey" FOREIGN KEY ("panelTypeCode") REFERENCES "PanelType"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creative" ADD CONSTRAINT "Creative_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativePlacement" ADD CONSTRAINT "CreativePlacement_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativePlacement" ADD CONSTRAINT "CreativePlacement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCheck" ADD CONSTRAINT "VerificationCheck_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationProof" ADD CONSTRAINT "InstallationProof_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationProof" ADD CONSTRAINT "InstallationProof_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "VerificationCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudSignal" ADD CONSTRAINT "FraudSignal_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrScan" ADD CONSTRAINT "QrScan_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
