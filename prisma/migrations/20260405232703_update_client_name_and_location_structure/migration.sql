/*
  Warnings:

  - You are about to drop the column `city` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `Client` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name_1` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Client_full_name_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "city",
DROP COLUMN "full_name",
ADD COLUMN     "admin_level_1" TEXT,
ADD COLUMN     "admin_level_2" TEXT,
ADD COLUMN     "admin_level_3" TEXT,
ADD COLUMN     "country_code" TEXT NOT NULL DEFAULT 'CR',
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name_1" TEXT NOT NULL,
ADD COLUMN     "last_name_2" TEXT,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "location_notes" TEXT,
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "reference_point" TEXT;

-- CreateIndex
CREATE INDEX "Client_first_name_idx" ON "Client"("first_name");

-- CreateIndex
CREATE INDEX "Client_last_name_1_idx" ON "Client"("last_name_1");

-- CreateIndex
CREATE INDEX "Client_country_code_idx" ON "Client"("country_code");

-- CreateIndex
CREATE INDEX "Client_admin_level_1_idx" ON "Client"("admin_level_1");

-- CreateIndex
CREATE INDEX "Client_admin_level_2_idx" ON "Client"("admin_level_2");

-- CreateIndex
CREATE INDEX "Client_admin_level_3_idx" ON "Client"("admin_level_3");
