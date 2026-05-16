-- CreateTable
CREATE TABLE "FollowUpNote" (
    "follow_up_note_id" UUID NOT NULL,
    "follow_up_id" UUID NOT NULL,
    "note_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpNote_pkey" PRIMARY KEY ("follow_up_note_id")
);

-- CreateIndex
CREATE INDEX "FollowUpNote_follow_up_id_idx" ON "FollowUpNote"("follow_up_id");

-- AddForeignKey
ALTER TABLE "FollowUpNote" ADD CONSTRAINT "FollowUpNote_follow_up_id_fkey" FOREIGN KEY ("follow_up_id") REFERENCES "FollowUp"("follow_up_id") ON DELETE CASCADE ON UPDATE CASCADE;
