CREATE TABLE "CreativePlacement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "creativeId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "scale" REAL NOT NULL DEFAULT 1,
  "offsetX" REAL NOT NULL DEFAULT 0,
  "offsetY" REAL NOT NULL DEFAULT 0,
  "rotation" REAL NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CreativePlacement_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "Creative" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CreativePlacement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "PanelListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CreativePlacement_creativeId_listingId_key" ON "CreativePlacement"("creativeId","listingId");
