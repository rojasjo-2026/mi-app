-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "admin_level_1" TEXT,
ADD COLUMN     "admin_level_2" TEXT,
ADD COLUMN     "admin_level_3" TEXT;

-- CreateIndex
CREATE INDEX "Installation_admin_level_1_idx" ON "Installation"("admin_level_1");

-- CreateIndex
CREATE INDEX "Installation_admin_level_2_idx" ON "Installation"("admin_level_2");

-- CreateIndex
CREATE INDEX "Installation_admin_level_3_idx" ON "Installation"("admin_level_3");
