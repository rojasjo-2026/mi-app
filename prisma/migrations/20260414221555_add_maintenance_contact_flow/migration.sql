-- CreateEnum
CREATE TYPE "MaintenanceContactFlowStatus" AS ENUM ('PENDING', 'MESSAGE_SENT', 'WAITING_RESPONSE', 'OPTIONS_SENT', 'DATE_SELECTED', 'CONFIRMED', 'MANUAL_REQUIRED', 'NO_RESPONSE', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactMessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateTable
CREATE TABLE "MaintenanceContactFlow" (
    "contact_flow_id" UUID NOT NULL,
    "follow_up_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "installation_id" UUID,
    "trigger_date" TIMESTAMP(3) NOT NULL,
    "status" "MaintenanceContactFlowStatus" NOT NULL DEFAULT 'PENDING',
    "first_message_sent_at" TIMESTAMP(3),
    "last_message_at" TIMESTAMP(3),
    "selected_date" TIMESTAMP(3),
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "requires_manual_action" BOOLEAN NOT NULL DEFAULT false,
    "manual_reason" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceContactFlow_pkey" PRIMARY KEY ("contact_flow_id")
);

-- CreateTable
CREATE TABLE "MaintenanceContactMessage" (
    "message_id" UUID NOT NULL,
    "contact_flow_id" UUID NOT NULL,
    "direction" "ContactMessageDirection" NOT NULL,
    "message_text" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceContactMessage_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE INDEX "MaintenanceContactFlow_follow_up_id_idx" ON "MaintenanceContactFlow"("follow_up_id");

-- CreateIndex
CREATE INDEX "MaintenanceContactFlow_client_id_idx" ON "MaintenanceContactFlow"("client_id");

-- CreateIndex
CREATE INDEX "MaintenanceContactFlow_installation_id_idx" ON "MaintenanceContactFlow"("installation_id");

-- CreateIndex
CREATE INDEX "MaintenanceContactFlow_status_idx" ON "MaintenanceContactFlow"("status");

-- CreateIndex
CREATE INDEX "MaintenanceContactFlow_trigger_date_idx" ON "MaintenanceContactFlow"("trigger_date");

-- CreateIndex
CREATE INDEX "MaintenanceContactMessage_contact_flow_id_idx" ON "MaintenanceContactMessage"("contact_flow_id");

-- CreateIndex
CREATE INDEX "MaintenanceContactMessage_direction_idx" ON "MaintenanceContactMessage"("direction");

-- AddForeignKey
ALTER TABLE "MaintenanceContactFlow" ADD CONSTRAINT "MaintenanceContactFlow_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "FollowUp"("follow_up_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceContactFlow" ADD CONSTRAINT "MaintenanceContactFlow_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceContactFlow" ADD CONSTRAINT "MaintenanceContactFlow_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "Installation"("installation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceContactMessage" ADD CONSTRAINT "MaintenanceContactMessage_contact_flow_id_fkey" FOREIGN KEY ("contact_flow_id") REFERENCES "MaintenanceContactFlow"("contact_flow_id") ON DELETE CASCADE ON UPDATE CASCADE;
