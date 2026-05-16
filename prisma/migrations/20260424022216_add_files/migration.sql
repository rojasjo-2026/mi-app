-- CreateTable
CREATE TABLE "File" (
    "file_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("file_id")
);

-- CreateIndex
CREATE INDEX "File_entity_type_idx" ON "File"("entity_type");

-- CreateIndex
CREATE INDEX "File_entity_id_idx" ON "File"("entity_id");
