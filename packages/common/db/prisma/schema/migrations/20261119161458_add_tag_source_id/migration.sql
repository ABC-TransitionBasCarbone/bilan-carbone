-- AlterTable
ALTER TABLE "bilan_carbone"."study_tag" ADD COLUMN     "source_study_tag_id" TEXT;

-- CreateIndex
CREATE INDEX "study_tag_source_study_tag_id_idx" ON "bilan_carbone"."study_tag"("source_study_tag_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_tag" ADD CONSTRAINT "study_tag_source_study_tag_id_fkey" FOREIGN KEY ("source_study_tag_id") REFERENCES "bilan_carbone"."study_tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
