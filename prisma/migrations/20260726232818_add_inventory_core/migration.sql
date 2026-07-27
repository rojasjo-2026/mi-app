-- CreateEnum
CREATE TYPE "InventoryProductType" AS ENUM ('STOCK_ITEM', 'CONSUMABLE', 'SPARE_PART', 'ASSET', 'RAW_MATERIAL', 'FINISHED_GOOD', 'KIT', 'SERVICE');

-- CreateEnum
CREATE TYPE "InventoryTrackingMode" AS ENUM ('NONE', 'SERIAL', 'LOT');

-- CreateEnum
CREATE TYPE "InventoryLocationType" AS ENUM ('WAREHOUSE', 'STORAGE_AREA', 'BRANCH', 'WORKSHOP', 'VEHICLE', 'STAFF', 'IN_TRANSIT', 'REPAIR', 'DAMAGED', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "InventoryCodeType" AS ENUM ('SKU', 'BARCODE', 'QR', 'SUPPLIER', 'ALTERNATE');

-- CreateEnum
CREATE TYPE "InventoryDocumentType" AS ENUM ('OPENING_BALANCE', 'RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE', 'RETURN_IN', 'RETURN_OUT');

-- CreateEnum
CREATE TYPE "InventoryDocumentStatus" AS ENUM ('DRAFT', 'POSTED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INBOUND', 'OUTBOUND', 'TRANSFER_DISPATCH', 'TRANSFER_RECEIPT', 'REVERSAL');

-- CreateTable
CREATE TABLE "InventoryCategory" (
    "inventory_category_id" UUID NOT NULL,
    "parent_category_id" UUID,
    "category_code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY ("inventory_category_id")
);

-- CreateTable
CREATE TABLE "UnitOfMeasure" (
    "unit_of_measure_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "allows_decimal" BOOLEAN NOT NULL DEFAULT true,
    "decimal_scale" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitOfMeasure_pkey" PRIMARY KEY ("unit_of_measure_id")
);

-- CreateTable
CREATE TABLE "InventoryProduct" (
    "inventory_product_id" UUID NOT NULL,
    "inventory_category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "product_type" "InventoryProductType" NOT NULL,
    "tracking_mode" "InventoryTrackingMode" NOT NULL DEFAULT 'NONE',
    "manages_stock" BOOLEAN NOT NULL DEFAULT true,
    "has_expiration" BOOLEAN NOT NULL DEFAULT false,
    "allow_negative_stock" BOOLEAN NOT NULL DEFAULT false,
    "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "tax_rate" DECIMAL(5,2),
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryProduct_pkey" PRIMARY KEY ("inventory_product_id")
);

-- CreateTable
CREATE TABLE "InventoryProductVariant" (
    "inventory_product_variant_id" UUID NOT NULL,
    "inventory_product_id" UUID NOT NULL,
    "stock_unit_id" UUID NOT NULL,
    "name" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "default_cost" DECIMAL(14,4),
    "default_price" DECIMAL(14,2),
    "minimum_stock" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "maximum_stock" DECIMAL(18,6),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryProductVariant_pkey" PRIMARY KEY ("inventory_product_variant_id")
);

-- CreateTable
CREATE TABLE "InventoryProductCode" (
    "inventory_product_code_id" UUID NOT NULL,
    "inventory_product_variant_id" UUID NOT NULL,
    "unit_of_measure_id" UUID,
    "code" TEXT NOT NULL,
    "code_type" "InventoryCodeType" NOT NULL,
    "label" TEXT,
    "quantity_in_stock_unit" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_scannable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryProductCode_pkey" PRIMARY KEY ("inventory_product_code_id")
);

-- CreateTable
CREATE TABLE "InventoryLocation" (
    "inventory_location_id" UUID NOT NULL,
    "parent_location_id" UUID,
    "location_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location_type" "InventoryLocationType" NOT NULL,
    "country_code" TEXT,
    "address_line" TEXT,
    "reference_point" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "allows_stock" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLocation_pkey" PRIMARY KEY ("inventory_location_id")
);

-- CreateTable
CREATE TABLE "InventoryStockBalance" (
    "inventory_stock_balance_id" UUID NOT NULL,
    "inventory_product_variant_id" UUID NOT NULL,
    "inventory_location_id" UUID NOT NULL,
    "quantity_on_hand" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "quantity_reserved" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "average_unit_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStockBalance_pkey" PRIMARY KEY ("inventory_stock_balance_id")
);

-- CreateTable
CREATE TABLE "InventoryDocument" (
    "inventory_document_id" UUID NOT NULL,
    "reversal_of_document_id" UUID,
    "source_location_id" UUID,
    "destination_location_id" UUID,
    "document_number" TEXT NOT NULL,
    "document_type" "InventoryDocumentType" NOT NULL,
    "status" "InventoryDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "document_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "reference_number" TEXT,
    "idempotency_key" TEXT,
    "total_cost" DECIMAL(16,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "cancellation_reason" TEXT,
    "reversal_reason" TEXT,
    "created_by" TEXT,
    "posted_by" TEXT,
    "received_by" TEXT,
    "cancelled_by" TEXT,
    "reversed_by" TEXT,
    "posted_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "reversed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryDocument_pkey" PRIMARY KEY ("inventory_document_id")
);

-- CreateTable
CREATE TABLE "InventoryDocumentLine" (
    "inventory_document_line_id" UUID NOT NULL,
    "inventory_document_id" UUID NOT NULL,
    "inventory_product_variant_id" UUID NOT NULL,
    "inventory_product_code_id" UUID,
    "unit_of_measure_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "conversion_factor" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "stock_quantity" DECIMAL(18,6) NOT NULL,
    "received_stock_quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(16,4) NOT NULL DEFAULT 0,
    "product_name_snapshot" TEXT NOT NULL,
    "variant_name_snapshot" TEXT,
    "unit_code_snapshot" TEXT NOT NULL,
    "code_snapshot" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryDocumentLine_pkey" PRIMARY KEY ("inventory_document_line_id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "inventory_movement_id" UUID NOT NULL,
    "reversal_of_movement_id" UUID,
    "inventory_document_id" UUID NOT NULL,
    "inventory_document_line_id" UUID NOT NULL,
    "inventory_product_variant_id" UUID NOT NULL,
    "inventory_location_id" UUID NOT NULL,
    "posting_key" TEXT NOT NULL,
    "movement_type" "InventoryMovementType" NOT NULL,
    "quantity_delta" DECIMAL(18,6) NOT NULL,
    "unit_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "total_cost_delta" DECIMAL(16,4) NOT NULL DEFAULT 0,
    "movement_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("inventory_movement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCategory_category_code_key" ON "InventoryCategory"("category_code");

-- CreateIndex
CREATE INDEX "InventoryCategory_parent_category_id_idx" ON "InventoryCategory"("parent_category_id");

-- CreateIndex
CREATE INDEX "InventoryCategory_name_idx" ON "InventoryCategory"("name");

-- CreateIndex
CREATE INDEX "InventoryCategory_sort_order_idx" ON "InventoryCategory"("sort_order");

-- CreateIndex
CREATE INDEX "InventoryCategory_is_active_idx" ON "InventoryCategory"("is_active");

-- CreateIndex
CREATE INDEX "InventoryCategory_parent_category_id_is_active_sort_order_idx" ON "InventoryCategory"("parent_category_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "UnitOfMeasure_code_key" ON "UnitOfMeasure"("code");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_name_idx" ON "UnitOfMeasure"("name");

-- CreateIndex
CREATE INDEX "UnitOfMeasure_is_active_idx" ON "UnitOfMeasure"("is_active");

-- CreateIndex
CREATE INDEX "InventoryProduct_inventory_category_id_idx" ON "InventoryProduct"("inventory_category_id");

-- CreateIndex
CREATE INDEX "InventoryProduct_name_idx" ON "InventoryProduct"("name");

-- CreateIndex
CREATE INDEX "InventoryProduct_brand_idx" ON "InventoryProduct"("brand");

-- CreateIndex
CREATE INDEX "InventoryProduct_model_idx" ON "InventoryProduct"("model");

-- CreateIndex
CREATE INDEX "InventoryProduct_product_type_idx" ON "InventoryProduct"("product_type");

-- CreateIndex
CREATE INDEX "InventoryProduct_tracking_mode_idx" ON "InventoryProduct"("tracking_mode");

-- CreateIndex
CREATE INDEX "InventoryProduct_is_active_idx" ON "InventoryProduct"("is_active");

-- CreateIndex
CREATE INDEX "InventoryProduct_inventory_category_id_is_active_idx" ON "InventoryProduct"("inventory_category_id", "is_active");

-- CreateIndex
CREATE INDEX "InventoryProductVariant_inventory_product_id_idx" ON "InventoryProductVariant"("inventory_product_id");

-- CreateIndex
CREATE INDEX "InventoryProductVariant_stock_unit_id_idx" ON "InventoryProductVariant"("stock_unit_id");

-- CreateIndex
CREATE INDEX "InventoryProductVariant_is_default_idx" ON "InventoryProductVariant"("is_default");

-- CreateIndex
CREATE INDEX "InventoryProductVariant_sort_order_idx" ON "InventoryProductVariant"("sort_order");

-- CreateIndex
CREATE INDEX "InventoryProductVariant_is_active_idx" ON "InventoryProductVariant"("is_active");

-- CreateIndex
CREATE INDEX "InventoryProductVariant_inventory_product_id_is_active_idx" ON "InventoryProductVariant"("inventory_product_id", "is_active");

-- CreateIndex
CREATE INDEX "InventoryProductCode_inventory_product_variant_id_idx" ON "InventoryProductCode"("inventory_product_variant_id");

-- CreateIndex
CREATE INDEX "InventoryProductCode_unit_of_measure_id_idx" ON "InventoryProductCode"("unit_of_measure_id");

-- CreateIndex
CREATE INDEX "InventoryProductCode_code_type_idx" ON "InventoryProductCode"("code_type");

-- CreateIndex
CREATE INDEX "InventoryProductCode_is_primary_idx" ON "InventoryProductCode"("is_primary");

-- CreateIndex
CREATE INDEX "InventoryProductCode_is_scannable_idx" ON "InventoryProductCode"("is_scannable");

-- CreateIndex
CREATE INDEX "InventoryProductCode_is_active_idx" ON "InventoryProductCode"("is_active");

-- CreateIndex
CREATE INDEX "InventoryProductCode_inventory_product_variant_id_is_active_idx" ON "InventoryProductCode"("inventory_product_variant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryProductCode_code_key" ON "InventoryProductCode"("code");

-- CreateIndex
CREATE INDEX "InventoryLocation_parent_location_id_idx" ON "InventoryLocation"("parent_location_id");

-- CreateIndex
CREATE INDEX "InventoryLocation_name_idx" ON "InventoryLocation"("name");

-- CreateIndex
CREATE INDEX "InventoryLocation_location_type_idx" ON "InventoryLocation"("location_type");

-- CreateIndex
CREATE INDEX "InventoryLocation_country_code_idx" ON "InventoryLocation"("country_code");

-- CreateIndex
CREATE INDEX "InventoryLocation_allows_stock_idx" ON "InventoryLocation"("allows_stock");

-- CreateIndex
CREATE INDEX "InventoryLocation_is_default_idx" ON "InventoryLocation"("is_default");

-- CreateIndex
CREATE INDEX "InventoryLocation_sort_order_idx" ON "InventoryLocation"("sort_order");

-- CreateIndex
CREATE INDEX "InventoryLocation_is_active_idx" ON "InventoryLocation"("is_active");

-- CreateIndex
CREATE INDEX "InventoryLocation_parent_location_id_is_active_sort_order_idx" ON "InventoryLocation"("parent_location_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryLocation_location_code_key" ON "InventoryLocation"("location_code");

-- CreateIndex
CREATE INDEX "InventoryStockBalance_inventory_product_variant_id_idx" ON "InventoryStockBalance"("inventory_product_variant_id");

-- CreateIndex
CREATE INDEX "InventoryStockBalance_inventory_location_id_idx" ON "InventoryStockBalance"("inventory_location_id");

-- CreateIndex
CREATE INDEX "InventoryStockBalance_quantity_on_hand_idx" ON "InventoryStockBalance"("quantity_on_hand");

-- CreateIndex
CREATE INDEX "InventoryStockBalance_quantity_reserved_idx" ON "InventoryStockBalance"("quantity_reserved");

-- CreateIndex
CREATE INDEX "InventoryStockBalance_inventory_location_id_quantity_on_han_idx" ON "InventoryStockBalance"("inventory_location_id", "quantity_on_hand");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStockBalance_inventory_product_variant_id_inventor_key" ON "InventoryStockBalance"("inventory_product_variant_id", "inventory_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDocument_reversal_of_document_id_key" ON "InventoryDocument"("reversal_of_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDocument_idempotency_key_key" ON "InventoryDocument"("idempotency_key");

-- CreateIndex
CREATE INDEX "InventoryDocument_document_type_idx" ON "InventoryDocument"("document_type");

-- CreateIndex
CREATE INDEX "InventoryDocument_status_idx" ON "InventoryDocument"("status");

-- CreateIndex
CREATE INDEX "InventoryDocument_source_location_id_idx" ON "InventoryDocument"("source_location_id");

-- CreateIndex
CREATE INDEX "InventoryDocument_destination_location_id_idx" ON "InventoryDocument"("destination_location_id");

-- CreateIndex
CREATE INDEX "InventoryDocument_document_date_idx" ON "InventoryDocument"("document_date");

-- CreateIndex
CREATE INDEX "InventoryDocument_reference_type_reference_id_idx" ON "InventoryDocument"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "InventoryDocument_created_at_idx" ON "InventoryDocument"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDocument_document_number_key" ON "InventoryDocument"("document_number");

-- CreateIndex
CREATE INDEX "InventoryDocumentLine_inventory_document_id_idx" ON "InventoryDocumentLine"("inventory_document_id");

-- CreateIndex
CREATE INDEX "InventoryDocumentLine_inventory_product_variant_id_idx" ON "InventoryDocumentLine"("inventory_product_variant_id");

-- CreateIndex
CREATE INDEX "InventoryDocumentLine_inventory_product_code_id_idx" ON "InventoryDocumentLine"("inventory_product_code_id");

-- CreateIndex
CREATE INDEX "InventoryDocumentLine_unit_of_measure_id_idx" ON "InventoryDocumentLine"("unit_of_measure_id");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDocumentLine_inventory_document_id_line_number_key" ON "InventoryDocumentLine"("inventory_document_id", "line_number");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_reversal_of_movement_id_key" ON "InventoryMovement"("reversal_of_movement_id");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryMovement_posting_key_key" ON "InventoryMovement"("posting_key");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventory_document_id_idx" ON "InventoryMovement"("inventory_document_id");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventory_document_line_id_idx" ON "InventoryMovement"("inventory_document_line_id");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventory_product_variant_id_idx" ON "InventoryMovement"("inventory_product_variant_id");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventory_location_id_idx" ON "InventoryMovement"("inventory_location_id");

-- CreateIndex
CREATE INDEX "InventoryMovement_movement_type_idx" ON "InventoryMovement"("movement_type");

-- CreateIndex
CREATE INDEX "InventoryMovement_movement_at_idx" ON "InventoryMovement"("movement_at");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventory_product_variant_id_inventory_lo_idx" ON "InventoryMovement"("inventory_product_variant_id", "inventory_location_id", "movement_at");

-- AddForeignKey
ALTER TABLE "InventoryCategory" ADD CONSTRAINT "InventoryCategory_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "InventoryCategory"("inventory_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryProduct" ADD CONSTRAINT "InventoryProduct_inventory_category_id_fkey" FOREIGN KEY ("inventory_category_id") REFERENCES "InventoryCategory"("inventory_category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryProductVariant" ADD CONSTRAINT "InventoryProductVariant_inventory_product_id_fkey" FOREIGN KEY ("inventory_product_id") REFERENCES "InventoryProduct"("inventory_product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryProductVariant" ADD CONSTRAINT "InventoryProductVariant_stock_unit_id_fkey" FOREIGN KEY ("stock_unit_id") REFERENCES "UnitOfMeasure"("unit_of_measure_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryProductCode" ADD CONSTRAINT "InventoryProductCode_inventory_product_variant_id_fkey" FOREIGN KEY ("inventory_product_variant_id") REFERENCES "InventoryProductVariant"("inventory_product_variant_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryProductCode" ADD CONSTRAINT "InventoryProductCode_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "UnitOfMeasure"("unit_of_measure_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLocation" ADD CONSTRAINT "InventoryLocation_parent_location_id_fkey" FOREIGN KEY ("parent_location_id") REFERENCES "InventoryLocation"("inventory_location_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStockBalance" ADD CONSTRAINT "InventoryStockBalance_inventory_product_variant_id_fkey" FOREIGN KEY ("inventory_product_variant_id") REFERENCES "InventoryProductVariant"("inventory_product_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStockBalance" ADD CONSTRAINT "InventoryStockBalance_inventory_location_id_fkey" FOREIGN KEY ("inventory_location_id") REFERENCES "InventoryLocation"("inventory_location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_source_location_id_fkey" FOREIGN KEY ("source_location_id") REFERENCES "InventoryLocation"("inventory_location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_destination_location_id_fkey" FOREIGN KEY ("destination_location_id") REFERENCES "InventoryLocation"("inventory_location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocument" ADD CONSTRAINT "InventoryDocument_reversal_of_document_id_fkey" FOREIGN KEY ("reversal_of_document_id") REFERENCES "InventoryDocument"("inventory_document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_inventory_document_id_fkey" FOREIGN KEY ("inventory_document_id") REFERENCES "InventoryDocument"("inventory_document_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_inventory_product_variant_id_fkey" FOREIGN KEY ("inventory_product_variant_id") REFERENCES "InventoryProductVariant"("inventory_product_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_inventory_product_code_id_fkey" FOREIGN KEY ("inventory_product_code_id") REFERENCES "InventoryProductCode"("inventory_product_code_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDocumentLine" ADD CONSTRAINT "InventoryDocumentLine_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "UnitOfMeasure"("unit_of_measure_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventory_document_id_fkey" FOREIGN KEY ("inventory_document_id") REFERENCES "InventoryDocument"("inventory_document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventory_document_line_id_fkey" FOREIGN KEY ("inventory_document_line_id") REFERENCES "InventoryDocumentLine"("inventory_document_line_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventory_product_variant_id_fkey" FOREIGN KEY ("inventory_product_variant_id") REFERENCES "InventoryProductVariant"("inventory_product_variant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventory_location_id_fkey" FOREIGN KEY ("inventory_location_id") REFERENCES "InventoryLocation"("inventory_location_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_reversal_of_movement_id_fkey" FOREIGN KEY ("reversal_of_movement_id") REFERENCES "InventoryMovement"("inventory_movement_id") ON DELETE RESTRICT ON UPDATE CASCADE;
