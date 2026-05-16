/*
  Warnings:

  - The `installation_status` column on the `Installation` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');

-- AlterTable
ALTER TABLE "Installation" DROP COLUMN "installation_status",
ADD COLUMN     "installation_status" "InstallationStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "InstallationChangeLog" (
    "change_log_id" UUID NOT NULL,
    "installation_id" UUID NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" UUID,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstallationChangeLog_pkey" PRIMARY KEY ("change_log_id")
);

-- CreateIndex
CREATE INDEX "InstallationChangeLog_installation_id_idx" ON "InstallationChangeLog"("installation_id");

-- CreateIndex
CREATE INDEX "InstallationChangeLog_changed_by_idx" ON "InstallationChangeLog"("changed_by");

-- CreateIndex
CREATE INDEX "InstallationChangeLog_changed_at_idx" ON "InstallationChangeLog"("changed_at");

-- CreateIndex
CREATE INDEX "Installation_installation_status_idx" ON "Installation"("installation_status");

-- CreateIndex
CREATE INDEX "ServiceType_is_active_idx" ON "ServiceType"("is_active");

-- AddForeignKey
ALTER TABLE "InstallationChangeLog" ADD CONSTRAINT "InstallationChangeLog_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "Installation"("installation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationChangeLog" ADD CONSTRAINT "InstallationChangeLog_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
