-- CreateTable
CREATE TABLE "OperationalZoneVisitDate" (
    "operational_zone_visit_date_id" UUID NOT NULL,
    "operational_zone_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalZoneVisitDate_pkey" PRIMARY KEY ("operational_zone_visit_date_id")
);

-- CreateIndex
CREATE INDEX "OperationalZoneVisitDate_operational_zone_id_idx" ON "OperationalZoneVisitDate"("operational_zone_id");

-- CreateIndex
CREATE INDEX "OperationalZoneVisitDate_visit_date_idx" ON "OperationalZoneVisitDate"("visit_date");

-- CreateIndex
CREATE INDEX "OperationalZoneVisitDate_is_active_idx" ON "OperationalZoneVisitDate"("is_active");

-- CreateIndex
CREATE INDEX "OperationalZoneVisitDate_operational_zone_id_is_active_visi_idx" ON "OperationalZoneVisitDate"("operational_zone_id", "is_active", "visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalZoneVisitDate_operational_zone_id_visit_date_key" ON "OperationalZoneVisitDate"("operational_zone_id", "visit_date");

-- AddForeignKey
ALTER TABLE "OperationalZoneVisitDate" ADD CONSTRAINT "OperationalZoneVisitDate_operational_zone_id_fkey" FOREIGN KEY ("operational_zone_id") REFERENCES "OperationalZone"("operational_zone_id") ON DELETE CASCADE ON UPDATE CASCADE;
