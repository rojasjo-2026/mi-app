-- CreateEnum
CREATE TYPE "InstallationComponentStatus" AS ENUM ('OPERATIVE', 'REVIEW_REQUIRED', 'REPLACEMENT_SUGGESTED');

-- CreateTable
CREATE TABLE "InstallationComponent" (
    "component_id" UUID NOT NULL,
    "installation_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "status" "InstallationComponentStatus" NOT NULL DEFAULT 'OPERATIVE',
    "installation_date" TIMESTAMP(3),
    "next_review_date" TIMESTAMP(3),
    "technical_notes" TEXT,
    "source_template_item_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationComponent_pkey" PRIMARY KEY ("component_id")
);

-- CreateTable
CREATE TABLE "ComponentTemplateGroup" (
    "template_group_id" UUID NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentTemplateGroup_pkey" PRIMARY KEY ("template_group_id")
);

-- CreateTable
CREATE TABLE "ComponentTemplateItem" (
    "template_item_id" UUID NOT NULL,
    "template_group_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT,
    "default_quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "default_unit" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "suggested_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentTemplateItem_pkey" PRIMARY KEY ("template_item_id")
);

-- CreateIndex
CREATE INDEX "InstallationComponent_installation_id_idx" ON "InstallationComponent"("installation_id");

-- CreateIndex
CREATE INDEX "InstallationComponent_status_idx" ON "InstallationComponent"("status");

-- CreateIndex
CREATE INDEX "InstallationComponent_category_idx" ON "InstallationComponent"("category");

-- CreateIndex
CREATE INDEX "ComponentTemplateGroup_service_type_id_idx" ON "ComponentTemplateGroup"("service_type_id");

-- CreateIndex
CREATE INDEX "ComponentTemplateGroup_is_active_idx" ON "ComponentTemplateGroup"("is_active");

-- CreateIndex
CREATE INDEX "ComponentTemplateItem_template_group_id_idx" ON "ComponentTemplateItem"("template_group_id");

-- CreateIndex
CREATE INDEX "ComponentTemplateItem_sort_order_idx" ON "ComponentTemplateItem"("sort_order");

-- AddForeignKey
ALTER TABLE "InstallationComponent" ADD CONSTRAINT "InstallationComponent_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "Installation"("installation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentTemplateGroup" ADD CONSTRAINT "ComponentTemplateGroup_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "ServiceType"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentTemplateItem" ADD CONSTRAINT "ComponentTemplateItem_template_group_id_fkey" FOREIGN KEY ("template_group_id") REFERENCES "ComponentTemplateGroup"("template_group_id") ON DELETE CASCADE ON UPDATE CASCADE;
