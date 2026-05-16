-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "address_line" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "location_notes" TEXT,
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "reference_point" TEXT,
ADD COLUMN     "zone" TEXT;

-- CreateIndex
CREATE INDEX "Installation_city_idx" ON "Installation"("city");

-- CreateIndex
CREATE INDEX "Installation_zone_idx" ON "Installation"("zone");

-- CreateIndex
CREATE INDEX "Installation_installation_date_idx" ON "Installation"("installation_date");

-- CreateIndex
CREATE INDEX "Installation_installation_status_idx" ON "Installation"("installation_status");
