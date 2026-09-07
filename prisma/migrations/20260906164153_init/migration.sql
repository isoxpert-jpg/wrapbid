-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "bodyType" TEXT NOT NULL,
    "plateNumber" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" DATETIME,
    "verificationNotes" TEXT,
    "conditionRating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PanelCalibration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehiclePhotoId" TEXT NOT NULL,
    "panelTypeCode" TEXT NOT NULL,
    "x1" REAL NOT NULL,
    "y1" REAL NOT NULL,
    "x2" REAL NOT NULL,
    "y2" REAL NOT NULL,
    "x3" REAL NOT NULL,
    "y3" REAL NOT NULL,
    "x4" REAL NOT NULL,
    "y4" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PanelCalibration_vehiclePhotoId_fkey" FOREIGN KEY ("vehiclePhotoId") REFERENCES "VehiclePhoto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PanelCalibration_panelTypeCode_fkey" FOREIGN KEY ("panelTypeCode") REFERENCES "PanelType" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommuteProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "homeLabel" TEXT NOT NULL,
    "homeLat" REAL NOT NULL,
    "homeLng" REAL NOT NULL,
    "workLabel" TEXT NOT NULL,
    "workLat" REAL NOT NULL,
    "workLng" REAL NOT NULL,
    "commuteDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "areaType" TEXT NOT NULL,
    "parkingType" TEXT NOT NULL,
    "straightLineKm" REAL NOT NULL,
    "roadKm" REAL NOT NULL,
    "monthlyKm" REAL NOT NULL,
    "estMonthlyImpressions" INTEGER NOT NULL,
    "exposureScore" REAL NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommuteProfile_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PanelType" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "baseRateCents" INTEGER NOT NULL,
    "widthCm" REAL NOT NULL,
    "heightCm" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "PanelListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "panelTypeCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startingRentCents" INTEGER NOT NULL,
    "reserveRentCents" INTEGER,
    "currentRentCents" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL DEFAULT 3,
    "baseRateSnapshotCents" INTEGER NOT NULL,
    "exposureSnapshot" REAL NOT NULL,
    "auctionEndsAt" DATETIME NOT NULL,
    "winningBidId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PanelListing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PanelListing_panelTypeCode_fkey" FOREIGN KEY ("panelTypeCode") REFERENCES "PanelType" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertiserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budgetCents" INTEGER NOT NULL,
    "spentCents" INTEGER NOT NULL DEFAULT 0,
    "targetLabel" TEXT NOT NULL,
    "targetLat" REAL NOT NULL,
    "targetLng" REAL NOT NULL,
    "targetRadiusKm" REAL NOT NULL,
    "productCategory" TEXT,
    "landingUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignPanelTarget" (
    "campaignId" TEXT NOT NULL,
    "panelTypeCode" TEXT NOT NULL,

    PRIMARY KEY ("campaignId", "panelTypeCode"),
    CONSTRAINT "CampaignPanelTarget_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignPanelTarget_panelTypeCode_fkey" FOREIGN KEY ("panelTypeCode") REFERENCES "PanelType" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Creative" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "dominantHex" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Creative_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "monthlyAmountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bid_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bid_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bid_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Bid_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "advertiserId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "monthlyRentCents" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "totalValueCents" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "driverPayoutCents" INTEGER NOT NULL,
    "printCostCents" INTEGER NOT NULL,
    "shippingCostCents" INTEGER NOT NULL,
    "processingFeeCents" INTEGER NOT NULL,
    "platformMarginCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_SIGNATURES',
    "driverSignedAt" DATETIME,
    "driverSignedName" TEXT,
    "advertiserSignedAt" DATETIME,
    "advertiserSignedName" TEXT,
    "bodyMarkdown" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agreement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Agreement_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Agreement_advertiserId_fkey" FOREIGN KEY ("advertiserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Agreement_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Agreement_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "qrSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BLOCKED_UNSIGNED',
    "installedAt" DATETIME,
    "verifiedAt" DATETIME,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Installation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Installation_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QrScan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installationId" TEXT NOT NULL,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,
    CONSTRAINT "QrScan_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "periodMonth" TEXT NOT NULL,
    "agreementId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "defaultArea" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

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
CREATE INDEX "Campaign_advertiserId_idx" ON "Campaign"("advertiserId");

-- CreateIndex
CREATE INDEX "Creative_campaignId_idx" ON "Creative"("campaignId");

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
CREATE INDEX "QrScan_installationId_scannedAt_idx" ON "QrScan"("installationId", "scannedAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_periodMonth_idx" ON "LedgerEntry"("userId", "periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_region_key" ON "City"("name", "region");
