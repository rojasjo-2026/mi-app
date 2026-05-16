-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "auto_contact_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maintenance_contact_days_before" INTEGER;
