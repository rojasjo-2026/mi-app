-- CreateTable
CREATE TABLE "TechnicalNote" (
    "technical_note_id" UUID NOT NULL,
    "installation_id" UUID NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalNote_pkey" PRIMARY KEY ("technical_note_id")
);

-- CreateIndex
CREATE INDEX "TechnicalNote_installation_id_idx" ON "TechnicalNote"("installation_id");

-- AddForeignKey
ALTER TABLE "TechnicalNote" ADD CONSTRAINT "TechnicalNote_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "Installation"("installation_id") ON DELETE CASCADE ON UPDATE CASCADE;
