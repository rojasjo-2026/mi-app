-- CreateTable
CREATE TABLE "Client" (
    "client_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_primary" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "email" TEXT,
    "address_line" TEXT,
    "zone" TEXT,
    "city" TEXT,
    "client_status" TEXT NOT NULL DEFAULT 'active',
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("client_id")
);

-- CreateTable
CREATE TABLE "ClientNote" (
    "note_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNote_pkey" PRIMARY KEY ("note_id")
);

-- CreateTable
CREATE TABLE "ServiceType" (
    "service_type_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("service_type_id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "installation_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "installation_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "technical_observations" TEXT,
    "estimated_amount" DECIMAL(12,2),
    "warranty_months" INTEGER,
    "warranty_end_date" TIMESTAMP(3),
    "technician_name" TEXT,
    "installation_status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("installation_id")
);

-- CreateTable
CREATE TABLE "FollowUpStatus" (
    "follow_up_status_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FollowUpStatus_pkey" PRIMARY KEY ("follow_up_status_id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "follow_up_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "installation_id" UUID,
    "follow_up_status_id" INTEGER NOT NULL,
    "target_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "reason" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "created_from" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("follow_up_id")
);

-- CreateTable
CREATE TABLE "ContactChannel" (
    "contact_channel_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContactChannel_pkey" PRIMARY KEY ("contact_channel_id")
);

-- CreateTable
CREATE TABLE "ContactResult" (
    "contact_result_id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ContactResult_pkey" PRIMARY KEY ("contact_result_id")
);

-- CreateTable
CREATE TABLE "ContactAttempt" (
    "contact_attempt_id" UUID NOT NULL,
    "follow_up_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "contact_channel_id" INTEGER NOT NULL,
    "contact_result_id" INTEGER NOT NULL,
    "attempt_datetime" TIMESTAMP(3) NOT NULL,
    "note_text" TEXT,
    "next_action" TEXT,
    "next_target_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAttempt_pkey" PRIMARY KEY ("contact_attempt_id")
);

-- CreateIndex
CREATE INDEX "Client_full_name_idx" ON "Client"("full_name");

-- CreateIndex
CREATE INDEX "Client_phone_primary_idx" ON "Client"("phone_primary");

-- CreateIndex
CREATE INDEX "ClientNote_client_id_idx" ON "ClientNote"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_code_key" ON "ServiceType"("code");

-- CreateIndex
CREATE INDEX "Installation_client_id_idx" ON "Installation"("client_id");

-- CreateIndex
CREATE INDEX "Installation_service_type_id_idx" ON "Installation"("service_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpStatus_code_key" ON "FollowUpStatus"("code");

-- CreateIndex
CREATE INDEX "FollowUp_client_id_idx" ON "FollowUp"("client_id");

-- CreateIndex
CREATE INDEX "FollowUp_installation_id_idx" ON "FollowUp"("installation_id");

-- CreateIndex
CREATE INDEX "FollowUp_follow_up_status_id_idx" ON "FollowUp"("follow_up_status_id");

-- CreateIndex
CREATE INDEX "FollowUp_target_date_idx" ON "FollowUp"("target_date");

-- CreateIndex
CREATE UNIQUE INDEX "ContactChannel_code_key" ON "ContactChannel"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ContactResult_code_key" ON "ContactResult"("code");

-- CreateIndex
CREATE INDEX "ContactAttempt_follow_up_id_idx" ON "ContactAttempt"("follow_up_id");

-- CreateIndex
CREATE INDEX "ContactAttempt_client_id_idx" ON "ContactAttempt"("client_id");

-- AddForeignKey
ALTER TABLE "ClientNote" ADD CONSTRAINT "ClientNote_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "ServiceType"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "Installation"("installation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_follow_up_status_id_fkey" FOREIGN KEY ("follow_up_status_id") REFERENCES "FollowUpStatus"("follow_up_status_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "FollowUp"("follow_up_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_contact_channel_id_fkey" FOREIGN KEY ("contact_channel_id") REFERENCES "ContactChannel"("contact_channel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttempt" ADD CONSTRAINT "ContactAttempt_contact_result_id_fkey" FOREIGN KEY ("contact_result_id") REFERENCES "ContactResult"("contact_result_id") ON DELETE RESTRICT ON UPDATE CASCADE;
