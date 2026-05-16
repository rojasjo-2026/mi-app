-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('TECHNICIAN', 'SUPERVISOR', 'ADMINISTRATION', 'ADMIN');

-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "technician_id" UUID;

-- CreateTable
CREATE TABLE "User" (
    "user_id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name_1" TEXT NOT NULL,
    "last_name_2" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" "StaffRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_first_name_idx" ON "User"("first_name");

-- CreateIndex
CREATE INDEX "User_last_name_1_idx" ON "User"("last_name_1");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_is_active_idx" ON "User"("is_active");

-- CreateIndex
CREATE INDEX "Installation_technician_id_idx" ON "Installation"("technician_id");

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
