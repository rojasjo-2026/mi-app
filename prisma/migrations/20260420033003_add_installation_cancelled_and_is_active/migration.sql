-- AlterEnum
ALTER TYPE "InstallationStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Installation_is_active_idx" ON "Installation"("is_active");
