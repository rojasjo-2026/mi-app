-- DropForeignKey
ALTER TABLE "InstallationChangeLog" DROP CONSTRAINT "InstallationChangeLog_changed_by_fkey";

-- AlterTable
ALTER TABLE "InstallationChangeLog" ALTER COLUMN "changed_by" SET DATA TYPE TEXT;
