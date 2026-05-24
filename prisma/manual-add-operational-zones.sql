CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "OperationalZone" (
  "operational_zone_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "country_code" TEXT NOT NULL DEFAULT 'CR',
  "name" TEXT NOT NULL,
  "description" TEXT,
  "reference_address" TEXT,
  "latitude" DECIMAL(10,7),
  "longitude" DECIMAL(10,7),
  "radius_km" DECIMAL(8,2),
  "color_label" TEXT,
  "sort_order" INTEGER,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OperationalZone_pkey" PRIMARY KEY ("operational_zone_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OperationalZone_country_code_name_key"
ON "OperationalZone"("country_code", "name");

CREATE INDEX IF NOT EXISTS "OperationalZone_country_code_idx"
ON "OperationalZone"("country_code");

CREATE INDEX IF NOT EXISTS "OperationalZone_name_idx"
ON "OperationalZone"("name");

CREATE INDEX IF NOT EXISTS "OperationalZone_is_active_idx"
ON "OperationalZone"("is_active");

ALTER TABLE "Client"
ADD COLUMN IF NOT EXISTS "operational_zone_id" UUID;

ALTER TABLE "Installation"
ADD COLUMN IF NOT EXISTS "operational_zone_id" UUID;

ALTER TABLE "FollowUp"
ADD COLUMN IF NOT EXISTS "operational_zone_id" UUID;

CREATE INDEX IF NOT EXISTS "Client_operational_zone_id_idx"
ON "Client"("operational_zone_id");

CREATE INDEX IF NOT EXISTS "Installation_operational_zone_id_idx"
ON "Installation"("operational_zone_id");

CREATE INDEX IF NOT EXISTS "FollowUp_operational_zone_id_idx"
ON "FollowUp"("operational_zone_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Client_operational_zone_id_fkey'
  ) THEN
    ALTER TABLE "Client"
    ADD CONSTRAINT "Client_operational_zone_id_fkey"
    FOREIGN KEY ("operational_zone_id")
    REFERENCES "OperationalZone"("operational_zone_id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Installation_operational_zone_id_fkey'
  ) THEN
    ALTER TABLE "Installation"
    ADD CONSTRAINT "Installation_operational_zone_id_fkey"
    FOREIGN KEY ("operational_zone_id")
    REFERENCES "OperationalZone"("operational_zone_id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'FollowUp_operational_zone_id_fkey'
  ) THEN
    ALTER TABLE "FollowUp"
    ADD CONSTRAINT "FollowUp_operational_zone_id_fkey"
    FOREIGN KEY ("operational_zone_id")
    REFERENCES "OperationalZone"("operational_zone_id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
  END IF;
END $$;