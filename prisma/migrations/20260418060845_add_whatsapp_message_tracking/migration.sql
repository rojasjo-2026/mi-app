/*
  Warnings:

  - A unique constraint covering the columns `[wa_message_id]` on the table `MaintenanceContactMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "MaintenanceContactFlow" ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "last_inbound_message" TEXT;

-- AlterTable
ALTER TABLE "MaintenanceContactMessage" ADD COLUMN     "delivery_status" TEXT,
ADD COLUMN     "message_type" TEXT DEFAULT 'text',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "wa_message_id" TEXT;

-- CreateIndex
CREATE INDEX "MaintenanceContactFlow_contact_phone_idx" ON "MaintenanceContactFlow"("contact_phone");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceContactMessage_wa_message_id_key" ON "MaintenanceContactMessage"("wa_message_id");

-- CreateIndex
CREATE INDEX "MaintenanceContactMessage_phone_number_idx" ON "MaintenanceContactMessage"("phone_number");

-- CreateIndex
CREATE INDEX "MaintenanceContactMessage_message_type_idx" ON "MaintenanceContactMessage"("message_type");

-- CreateIndex
CREATE INDEX "MaintenanceContactMessage_delivery_status_idx" ON "MaintenanceContactMessage"("delivery_status");
