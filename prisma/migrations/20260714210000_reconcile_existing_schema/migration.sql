-- Reconciliation migration for objects that already exist in the real database
-- but were created outside Prisma Migrate.
-- Place this migration before 20260714211427_add_operational_zone_visit_dates.
-- It intentionally excludes OperationalZoneVisitDate and every Inventory* object.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "InvoiceSourceType" AS ENUM ('INSTALLATION', 'FOLLOW_UP', 'MANUAL');
CREATE TYPE "InvoicePaymentTerm" AS ENUM ('CASH', 'CREDIT');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'SINPE', 'BANK_TRANSFER', 'CARD', 'OTHER');
CREATE TYPE "CurrencyCode" AS ENUM ('CRC', 'USD', 'ARS', 'BOB', 'BRL', 'CAD', 'CLP', 'COP', 'DOP', 'EUR', 'GTQ', 'HNL', 'MXN', 'NIO', 'PEN', 'PYG', 'UYU', 'VES', 'XAF');
CREATE TYPE "ClientType" AS ENUM ('PERSON', 'COMPANY', 'OTHER');
CREATE TYPE "ClientComplianceProfile" AS ENUM ('GLOBAL', 'COSTA_RICA');
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'PROSPECT', 'ON_HOLD', 'INACTIVE');
CREATE TYPE "WorkBillingStatus" AS ENUM ('PENDING', 'INVOICED', 'PARTIALLY_PAID', 'PAID', 'NOT_BILLABLE', 'BILLING_ERROR', 'CANCELLED');
CREATE TYPE "ActivityLogCategory" AS ENUM ('CLIENT', 'INSTALLATION', 'FOLLOW_UP', 'CONTACT', 'FILE', 'FINANCE', 'SYSTEM');
CREATE TYPE "ActivityLogVisibility" AS ENUM ('PUBLIC_INTERNAL', 'STAFF_ONLY', 'ADMIN_ONLY', 'FINANCE_ONLY');
CREATE TYPE "ActivityLogAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'NOTE_ADDED', 'FILE_ADDED', 'FILE_REMOVED', 'CONTACT_REGISTERED', 'CONTACT_MESSAGE_SENT', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'PAYMENT_REGISTERED', 'SYSTEM_EVENT', 'FILE_REPLACED', 'FILE_PREVIEWED', 'CONTACT_FLOW_CREATED', 'CONTACT_MESSAGE_RECEIVED', 'CONTACT_STATUS_CHANGED', 'MAINTENANCE_SCHEDULED', 'INVOICE_CANCELLED', 'INVOICE_PAID', 'INVOICE_OVERDUE', 'PAYMENT_REVERSED', 'CALENDAR_NOTE_ADDED', 'CALENDAR_BLOCKED_DATE', 'CALENDAR_UNBLOCKED_DATE');
CREATE TYPE "CalendarNonWorkingDayType" AS ENUM ('HOLIDAY', 'INTERNAL_CLOSURE', 'COLLECTIVE_VACATION', 'SPECIAL_EVENT', 'OTHER');
CREATE TYPE "BusinessWeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "AgendaRuleValueType" AS ENUM ('NUMBER', 'DECIMAL', 'BOOLEAN', 'TEXT', 'SELECT', 'JSON');
CREATE TYPE "AgendaRuleScope" AS ENUM ('GLOBAL', 'WORK_CATEGORY', 'WORK_TYPE', 'ZONE');

-- Convert legacy Client status text to the current enum without losing values.
ALTER TABLE "Client" ALTER COLUMN "client_status" DROP DEFAULT;
ALTER TABLE "Client"
ALTER COLUMN "client_status" TYPE "ClientStatus"
USING (
  CASE UPPER("client_status")
    WHEN 'ACTIVE' THEN 'ACTIVE'::"ClientStatus"
    WHEN 'PROSPECT' THEN 'PROSPECT'::"ClientStatus"
    WHEN 'ON_HOLD' THEN 'ON_HOLD'::"ClientStatus"
    WHEN 'INACTIVE' THEN 'INACTIVE'::"ClientStatus"
    ELSE 'ACTIVE'::"ClientStatus"
  END
);
ALTER TABLE "Client" ALTER COLUMN "client_status" SET DEFAULT 'ACTIVE';

-- AlterTable: User
ALTER TABLE "User" ADD COLUMN "permissions" JSONB NOT NULL DEFAULT '{}';

-- AlterTable: Client
ALTER TABLE "Client" ADD COLUMN "billing_address" TEXT,
ADD COLUMN "billing_email" TEXT,
ADD COLUMN "billing_name" TEXT,
ADD COLUMN "billing_phone" TEXT,
ADD COLUMN "billing_same_as_client" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "client_type" "ClientType" NOT NULL DEFAULT 'PERSON',
ADD COLUMN "commercial_name" TEXT,
ADD COLUMN "company_name" TEXT,
ADD COLUMN "compliance_profile" "ClientComplianceProfile" NOT NULL DEFAULT 'COSTA_RICA',
ADD COLUMN "credit_limit" DECIMAL(12,2),
ADD COLUMN "data_consent_at" TIMESTAMP(3),
ADD COLUMN "data_consent_source" TEXT,
ADD COLUMN "default_credit_days" INTEGER,
ADD COLUMN "default_discount_rate" DECIMAL(5,2),
ADD COLUMN "default_payment_term" "InvoicePaymentTerm" NOT NULL DEFAULT 'CASH',
ADD COLUMN "display_name" TEXT,
ADD COLUMN "identification_country" TEXT NOT NULL DEFAULT 'CR',
ADD COLUMN "identification_number" TEXT,
ADD COLUMN "identification_type" TEXT,
ADD COLUMN "legal_name" TEXT,
ADD COLUMN "main_contact_name" TEXT,
ADD COLUMN "operational_zone_id" UUID,
ADD COLUMN "preferred_currency" "CurrencyCode" NOT NULL DEFAULT 'CRC',
ADD COLUMN "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tax_id" TEXT,
ADD COLUMN "whatsapp_opt_in_at" TIMESTAMP(3);

-- AlterTable: Installation
ALTER TABLE "Installation" ADD COLUMN "billing_block_reason" TEXT,
ADD COLUMN "billing_notes" TEXT,
ADD COLUMN "billing_status" "WorkBillingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "cost_amount" DECIMAL(12,2),
ADD COLUMN "final_amount" DECIMAL(12,2),
ADD COLUMN "operational_zone_id" UUID;

-- AlterTable: FollowUp
ALTER TABLE "FollowUp" ADD COLUMN "billing_block_reason" TEXT,
ADD COLUMN "billing_notes" TEXT,
ADD COLUMN "billing_status" "WorkBillingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "cost_amount" DECIMAL(12,2),
ADD COLUMN "estimated_amount" DECIMAL(12,2),
ADD COLUMN "final_amount" DECIMAL(12,2),
ADD COLUMN "maintenance_type" TEXT,
ADD COLUMN "operational_zone_id" UUID,
ADD COLUMN "technician_id" UUID;

-- AlterTable: File
ALTER TABLE "File" ADD COLUMN "file_path" TEXT;

-- CreateTable: ActivityLog
CREATE TABLE "ActivityLog" (
    "activity_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "category" "ActivityLogCategory" NOT NULL,
    "action" "ActivityLogAction" NOT NULL,
    "visibility" "ActivityLogVisibility" NOT NULL DEFAULT 'PUBLIC_INTERNAL',
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("activity_id")
);

-- CreateTable: CalendarNote
CREATE TABLE "CalendarNote" (
    "calendar_note_id" UUID NOT NULL,
    "note_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Nota',
    "note_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarNote_pkey" PRIMARY KEY ("calendar_note_id")
);

-- CreateTable: CalendarBlockedDate
CREATE TABLE "CalendarBlockedDate" (
    "calendar_blocked_date_id" UUID NOT NULL,
    "blocked_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarBlockedDate_pkey" PRIMARY KEY ("calendar_blocked_date_id")
);

-- CreateTable: CalendarNonWorkingDay
CREATE TABLE "CalendarNonWorkingDay" (
    "calendar_non_working_day_id" UUID NOT NULL,
    "non_working_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "CalendarNonWorkingDayType" NOT NULL DEFAULT 'HOLIDAY',
    "country_code" TEXT NOT NULL DEFAULT 'CR',
    "is_recurring_yearly" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CalendarNonWorkingDay_pkey" PRIMARY KEY ("calendar_non_working_day_id")
);

-- CreateTable: BusinessWorkingHour
CREATE TABLE "BusinessWorkingHour" (
    "business_working_hour_id" UUID NOT NULL,
    "day_of_week" "BusinessWeekDay" NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'CR',
    "is_working_day" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT,
    "end_time" TEXT,
    "break_start_time" TEXT,
    "break_end_time" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessWorkingHour_pkey" PRIMARY KEY ("business_working_hour_id")
);

-- CreateTable: AgendaRule
CREATE TABLE "AgendaRule" (
    "agenda_rule_id" UUID NOT NULL,
    "country_code" TEXT NOT NULL,
    "rule_key" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "rule_description" TEXT,
    "rule_scope" "AgendaRuleScope" NOT NULL,
    "applies_to_key" TEXT NOT NULL,
    "applies_to_name" TEXT,
    "value_type" "AgendaRuleValueType" NOT NULL,
    "value_number" INTEGER,
    "value_decimal" DECIMAL(12,2),
    "value_text" TEXT,
    "value_boolean" BOOLEAN,
    "value_json" JSONB,
    "unit" TEXT,
    "notes" TEXT,
    "sort_order" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgendaRule_pkey" PRIMARY KEY ("agenda_rule_id")
);

-- CreateTable: OperationalZone
CREATE TABLE "OperationalZone" (
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

-- CreateTable: AppSettings
CREATE TABLE "AppSettings" (
    "settings_id" UUID NOT NULL,
    "company_name" TEXT,
    "company_phone" TEXT,
    "company_email" TEXT,
    "country_code" TEXT NOT NULL DEFAULT 'CR',
    "country_name" TEXT NOT NULL DEFAULT 'Costa Rica',
    "default_client_compliance_profile" "ClientComplianceProfile" NOT NULL DEFAULT 'COSTA_RICA',
    "country_specific_validation_enabled" BOOLEAN NOT NULL DEFAULT true,
    "admin_level_1_label" TEXT NOT NULL DEFAULT 'Región / Provincia / Estado',
    "admin_level_2_label" TEXT NOT NULL DEFAULT 'Ciudad / Cantón / Municipio',
    "admin_level_3_label" TEXT DEFAULT 'Distrito / Zona',
    "timezone" TEXT NOT NULL DEFAULT 'America/Costa_Rica',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "phone_country_code" TEXT NOT NULL DEFAULT '+506',
    "default_currency" "CurrencyCode" NOT NULL DEFAULT 'CRC',
    "secondary_currency" "CurrencyCode" DEFAULT 'USD',
    "default_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 13,
    "whatsapp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_contact_enabled" BOOLEAN NOT NULL DEFAULT true,
    "maintenance_contact_days_before" INTEGER NOT NULL DEFAULT 22,
    "automatic_send_hour" INTEGER NOT NULL DEFAULT 9,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("settings_id")
);

-- CreateTable: Invoice
CREATE TABLE "Invoice" (
    "invoice_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "client_id" UUID NOT NULL,
    "installation_id" UUID,
    "follow_up_id" UUID,
    "source_type" "InvoiceSourceType" NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "payment_term" "InvoicePaymentTerm" NOT NULL DEFAULT 'CASH',
    "credit_days" INTEGER,
    "currency" "CurrencyCode" NOT NULL DEFAULT 'CRC',
    "subtotal_amount" DECIMAL(12,2) NOT NULL,
    "discount_rate" DECIMAL(5,2),
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_reason" TEXT,
    "tax_rate" DECIMAL(5,2),
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_amount" DECIMAL(12,2) NOT NULL,
    "customer_snapshot_name" TEXT NOT NULL,
    "customer_snapshot_phone" TEXT,
    "service_snapshot_description" TEXT,
    "location_snapshot" TEXT,
    "notes" TEXT,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable: InvoiceLine
CREATE TABLE "InvoiceLine" (
    "invoice_line_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("invoice_line_id")
);

-- CreateTable: InvoicePayment
CREATE TABLE "InvoicePayment" (
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_identification_country_identification_type_identific_key" ON "Client"("identification_country", "identification_type", "identification_number");
CREATE INDEX "Client_client_type_idx" ON "Client"("client_type");
CREATE INDEX "Client_compliance_profile_idx" ON "Client"("compliance_profile");
CREATE INDEX "Client_display_name_idx" ON "Client"("display_name");
CREATE INDEX "Client_legal_name_idx" ON "Client"("legal_name");
CREATE INDEX "Client_company_name_idx" ON "Client"("company_name");
CREATE INDEX "Client_commercial_name_idx" ON "Client"("commercial_name");
CREATE INDEX "Client_operational_zone_id_idx" ON "Client"("operational_zone_id");
CREATE INDEX "Client_tax_id_idx" ON "Client"("tax_id");
CREATE INDEX "Client_identification_country_idx" ON "Client"("identification_country");
CREATE INDEX "Client_identification_type_idx" ON "Client"("identification_type");
CREATE INDEX "Client_identification_number_idx" ON "Client"("identification_number");
CREATE INDEX "ActivityLog_client_id_idx" ON "ActivityLog"("client_id");
CREATE INDEX "ActivityLog_entity_type_idx" ON "ActivityLog"("entity_type");
CREATE INDEX "ActivityLog_entity_id_idx" ON "ActivityLog"("entity_id");
CREATE INDEX "ActivityLog_entity_type_entity_id_idx" ON "ActivityLog"("entity_type", "entity_id");
CREATE INDEX "ActivityLog_category_idx" ON "ActivityLog"("category");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_visibility_idx" ON "ActivityLog"("visibility");
CREATE INDEX "ActivityLog_created_at_idx" ON "ActivityLog"("created_at");
CREATE INDEX "Installation_operational_zone_id_idx" ON "Installation"("operational_zone_id");
CREATE INDEX "FollowUp_technician_id_idx" ON "FollowUp"("technician_id");
CREATE INDEX "FollowUp_operational_zone_id_idx" ON "FollowUp"("operational_zone_id");
CREATE INDEX "CalendarNote_note_date_idx" ON "CalendarNote"("note_date");
CREATE INDEX "CalendarBlockedDate_blocked_date_idx" ON "CalendarBlockedDate"("blocked_date");
CREATE UNIQUE INDEX "CalendarNonWorkingDay_non_working_date_country_code_key" ON "CalendarNonWorkingDay"("non_working_date", "country_code");
CREATE INDEX "CalendarNonWorkingDay_non_working_date_idx" ON "CalendarNonWorkingDay"("non_working_date");
CREATE INDEX "CalendarNonWorkingDay_country_code_idx" ON "CalendarNonWorkingDay"("country_code");
CREATE INDEX "CalendarNonWorkingDay_type_idx" ON "CalendarNonWorkingDay"("type");
CREATE INDEX "CalendarNonWorkingDay_is_active_idx" ON "CalendarNonWorkingDay"("is_active");
CREATE UNIQUE INDEX "BusinessWorkingHour_day_of_week_country_code_key" ON "BusinessWorkingHour"("day_of_week", "country_code");
CREATE INDEX "BusinessWorkingHour_day_of_week_idx" ON "BusinessWorkingHour"("day_of_week");
CREATE INDEX "BusinessWorkingHour_country_code_idx" ON "BusinessWorkingHour"("country_code");
CREATE INDEX "BusinessWorkingHour_is_working_day_idx" ON "BusinessWorkingHour"("is_working_day");
CREATE INDEX "BusinessWorkingHour_is_active_idx" ON "BusinessWorkingHour"("is_active");
CREATE UNIQUE INDEX "AgendaRule_country_code_rule_key_rule_scope_applies_to_key_key" ON "AgendaRule"("country_code", "rule_key", "rule_scope", "applies_to_key");
CREATE INDEX "AgendaRule_country_code_idx" ON "AgendaRule"("country_code");
CREATE INDEX "AgendaRule_rule_key_idx" ON "AgendaRule"("rule_key");
CREATE INDEX "AgendaRule_rule_scope_idx" ON "AgendaRule"("rule_scope");
CREATE INDEX "AgendaRule_applies_to_key_idx" ON "AgendaRule"("applies_to_key");
CREATE INDEX "AgendaRule_value_type_idx" ON "AgendaRule"("value_type");
CREATE INDEX "AgendaRule_is_active_idx" ON "AgendaRule"("is_active");
CREATE UNIQUE INDEX "OperationalZone_country_code_name_key" ON "OperationalZone"("country_code", "name");
CREATE INDEX "OperationalZone_country_code_idx" ON "OperationalZone"("country_code");
CREATE INDEX "OperationalZone_name_idx" ON "OperationalZone"("name");
CREATE INDEX "OperationalZone_is_active_idx" ON "OperationalZone"("is_active");
CREATE UNIQUE INDEX "Invoice_invoice_number_key" ON "Invoice"("invoice_number");
CREATE INDEX "Invoice_client_id_idx" ON "Invoice"("client_id");
CREATE INDEX "Invoice_installation_id_idx" ON "Invoice"("installation_id");
CREATE INDEX "Invoice_follow_up_id_idx" ON "Invoice"("follow_up_id");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_invoice_date_idx" ON "Invoice"("invoice_date");
CREATE INDEX "Invoice_due_date_idx" ON "Invoice"("due_date");
CREATE INDEX "InvoiceLine_invoice_id_idx" ON "InvoiceLine"("invoice_id");
CREATE INDEX "InvoicePayment_invoice_id_idx" ON "InvoicePayment"("invoice_id");
CREATE INDEX "InvoicePayment_payment_date_idx" ON "InvoicePayment"("payment_date");
CREATE INDEX "InvoicePayment_method_idx" ON "InvoicePayment"("method");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_operational_zone_id_fkey" FOREIGN KEY ("operational_zone_id") REFERENCES "OperationalZone"("operational_zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_operational_zone_id_fkey" FOREIGN KEY ("operational_zone_id") REFERENCES "OperationalZone"("operational_zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_operational_zone_id_fkey" FOREIGN KEY ("operational_zone_id") REFERENCES "OperationalZone"("operational_zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("client_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "Installation"("installation_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "FollowUp"("follow_up_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "Invoice"("invoice_id") ON DELETE CASCADE ON UPDATE CASCADE;