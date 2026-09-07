ALTER TABLE "Installation" ADD COLUMN "nextCheckAt" DATETIME;
ALTER TABLE "Vehicle" ADD COLUMN "plateHash" TEXT;

CREATE TABLE "VerificationCheck" (
    "id" TEXT NOT NULL PRIMARY KEY, "installationId" TEXT NOT NULL, "type" TEXT NOT NULL,
    "challengeCode" TEXT NOT NULL, "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL, "completedAt" DATETIME, "status" TEXT NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "VerificationCheck_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "InstallationProof" (
    "id" TEXT NOT NULL PRIMARY KEY, "installationId" TEXT NOT NULL, "checkId" TEXT NOT NULL,
    "photoPath" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "capturedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewedAt" DATETIME,
    "reviewedBy" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW', "reviewNotes" TEXT,
    CONSTRAINT "InstallationProof_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InstallationProof_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "VerificationCheck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "FraudSignal" (
    "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "listingId" TEXT, "bidId" TEXT,
    "type" TEXT NOT NULL, "riskScore" INTEGER NOT NULL, "details" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FraudSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FraudSignal_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FraudSignal_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CommuteProfile" (
    "id" TEXT NOT NULL PRIMARY KEY, "vehicleId" TEXT NOT NULL, "homeLabel" TEXT NOT NULL,
    "homeLat" REAL NOT NULL, "homeLng" REAL NOT NULL, "workLabel" TEXT NOT NULL,
    "workLat" REAL NOT NULL, "workLng" REAL NOT NULL, "commuteDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "areaType" TEXT NOT NULL, "parkingType" TEXT NOT NULL, "straightLineKm" REAL NOT NULL,
    "roadKm" REAL NOT NULL, "monthlyKm" REAL NOT NULL, "estMonthlyImpressions" INTEGER NOT NULL,
    "exposureScore" REAL NOT NULL, "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "routeConfidence" TEXT NOT NULL DEFAULT 'DECLARED',
    CONSTRAINT "CommuteProfile_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CommuteProfile" ("areaType","commuteDaysPerWeek","computedAt","estMonthlyImpressions","exposureScore","homeLabel","homeLat","homeLng","id","monthlyKm","parkingType","roadKm","straightLineKm","vehicleId","workLabel","workLat","workLng") SELECT "areaType","commuteDaysPerWeek","computedAt","estMonthlyImpressions","exposureScore","homeLabel","homeLat","homeLng","id","monthlyKm","parkingType","roadKm","straightLineKm","vehicleId","workLabel","workLat","workLng" FROM "CommuteProfile";
DROP TABLE "CommuteProfile";
ALTER TABLE "new_CommuteProfile" RENAME TO "CommuteProfile";
CREATE UNIQUE INDEX "CommuteProfile_vehicleId_key" ON "CommuteProfile"("vehicleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

CREATE UNIQUE INDEX "VerificationCheck_challengeCode_key" ON "VerificationCheck"("challengeCode");
CREATE INDEX "VerificationCheck_installationId_status_idx" ON "VerificationCheck"("installationId","status");
CREATE INDEX "VerificationCheck_expiresAt_status_idx" ON "VerificationCheck"("expiresAt","status");
CREATE UNIQUE INDEX "InstallationProof_checkId_key" ON "InstallationProof"("checkId");
CREATE INDEX "InstallationProof_installationId_status_idx" ON "InstallationProof"("installationId","status");
CREATE INDEX "FraudSignal_status_riskScore_idx" ON "FraudSignal"("status","riskScore");
CREATE INDEX "FraudSignal_userId_createdAt_idx" ON "FraudSignal"("userId","createdAt");
CREATE UNIQUE INDEX "Vehicle_plateHash_key" ON "Vehicle"("plateHash");
