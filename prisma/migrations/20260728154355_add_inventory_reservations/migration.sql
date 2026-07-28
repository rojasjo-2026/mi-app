-- CreateEnum
CREATE TYPE "InventoryReservationStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PARTIALLY_CONSUMED', 'CONSUMED', 'RELEASED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryReservationEventType" AS ENUM ('CREATED', 'ACTIVATED', 'CONSUMED', 'RELEASED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "inventory_reservation_id" UUID NOT NULL,
    "reservation_number" TEXT NOT NULL,
    "status" "InventoryReservationStatus" NOT NULL DEFAULT 'DRAFT',
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reference_number" TEXT,
    "idempotency_key" TEXT,
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_by" TEXT,
    "activated_by" TEXT,
    "released_by" TEXT,
    "expired_by" TEXT,
    "cancelled_by" TEXT,
    "activated_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("inventory_reservation_id")
);

-- CreateTable
CREATE TABLE "InventoryReservationLine" (
    "inventory_reservation_line_id" UUID NOT NULL,
    "inventory_reservation_id" UUID NOT NULL,
    "inventory_product_variant_id" UUID NOT NULL,
    "inventory_location_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "quantity_requested" DECIMAL(18,6) NOT NULL,
    "quantity_reserved" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "quantity_consumed" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "quantity_released" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryReservationLine_pkey" PRIMARY KEY ("inventory_reservation_line_id")
);

-- CreateTable
CREATE TABLE "InventoryReservationEvent" (
    "inventory_reservation_event_id" UUID NOT NULL,
    "inventory_reservation_id" UUID NOT NULL,
    "inventory_reservation_line_id" UUID,
    "event_type" "InventoryReservationEventType" NOT NULL,
    "previous_status" "InventoryReservationStatus",
    "new_status" "InventoryReservationStatus",
    "quantity" DECIMAL(18,6),
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reference_number" TEXT,
    "reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReservationEvent_pkey" PRIMARY KEY ("inventory_reservation_event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_reservation_number_key" ON "InventoryReservation"("reservation_number");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservation_idempotency_key_key" ON "InventoryReservation"("idempotency_key");

-- CreateIndex
CREATE INDEX "InventoryReservation_status_idx" ON "InventoryReservation"("status");

-- CreateIndex
CREATE INDEX "InventoryReservation_expires_at_idx" ON "InventoryReservation"("expires_at");

-- CreateIndex
CREATE INDEX "InventoryReservation_reference_type_reference_id_idx" ON "InventoryReservation"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "InventoryReservation_reference_number_idx" ON "InventoryReservation"("reference_number");

-- CreateIndex
CREATE INDEX "InventoryReservation_created_at_idx" ON "InventoryReservation"("created_at");

-- CreateIndex
CREATE INDEX "InventoryReservationLine_inventory_reservation_id_idx" ON "InventoryReservationLine"("inventory_reservation_id");

-- CreateIndex
CREATE INDEX "InventoryReservationLine_inventory_product_variant_id_idx" ON "InventoryReservationLine"("inventory_product_variant_id");

-- CreateIndex
CREATE INDEX "InventoryReservationLine_inventory_location_id_idx" ON "InventoryReservationLine"("inventory_location_id");

-- CreateIndex
CREATE INDEX "InventoryReservationLine_inventory_product_variant_id_inven_idx" ON "InventoryReservationLine"("inventory_product_variant_id", "inventory_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservationLine_inventory_reservation_id_line_numb_key" ON "InventoryReservationLine"("inventory_reservation_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryReservationLine_inventory_reservation_id_inventory_key" ON "InventoryReservationLine"("inventory_reservation_id", "inventory_product_variant_id", "inventory_location_id");

-- CreateIndex
CREATE INDEX "InventoryReservationEvent_inventory_reservation_id_idx" ON "InventoryReservationEvent"("inventory_reservation_id");

-- CreateIndex
CREATE INDEX "InventoryReservationEvent_inventory_reservation_line_id_idx" ON "InventoryReservationEvent"("inventory_reservation_line_id");

-- CreateIndex
CREATE INDEX "InventoryReservationEvent_event_type_idx" ON "InventoryReservationEvent"("event_type");

-- CreateIndex
CREATE INDEX "InventoryReservationEvent_created_at_idx" ON "InventoryReservationEvent"("created_at");

-- CreateIndex
CREATE INDEX "InventoryReservationEvent_inventory_reservation_id_created__idx" ON "InventoryReservationEvent"("inventory_reservation_id", "created_at");

-- CreateIndex
CREATE INDEX "InventoryReservationEvent_reference_type_reference_id_idx" ON "InventoryReservationEvent"("reference_type", "reference_id");

-- AddForeignKey
ALTER TABLE "InventoryReservationLine" ADD CONSTRAINT "InventoryReservationLine_inventory_reservation_id_fkey" FOREIGN KEY ("inventory_reservation_id") REFERENCES "InventoryReservation"("inventory_reservation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservationLine" ADD CONSTRAINT "InventoryReservationLine_inventory_product_variant_id_fkey" FOREIGN KEY ("inventory_product_variant_id") REFERENCES "InventoryProductVariant"("inventory_product_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservationLine" ADD CONSTRAINT "InventoryReservationLine_inventory_location_id_fkey" FOREIGN KEY ("inventory_location_id") REFERENCES "InventoryLocation"("inventory_location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservationEvent" ADD CONSTRAINT "InventoryReservationEvent_inventory_reservation_id_fkey" FOREIGN KEY ("inventory_reservation_id") REFERENCES "InventoryReservation"("inventory_reservation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryReservationEvent" ADD CONSTRAINT "InventoryReservationEvent_inventory_reservation_line_id_fkey" FOREIGN KEY ("inventory_reservation_line_id") REFERENCES "InventoryReservationLine"("inventory_reservation_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;
