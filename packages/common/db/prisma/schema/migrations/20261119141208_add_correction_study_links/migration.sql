/*
  Warnings:

  - A unique constraint covering the columns `[copied_study_id]` on the table `study_correction_deliveries` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[source_study_site_id,study_id]` on the table `study_sites` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD COLUMN     "copied_study_id" TEXT;

-- AlterTable
ALTER TABLE "bilan_carbone"."study_sites" ADD COLUMN     "source_study_site_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "study_correction_deliveries_copied_study_id_key" ON "bilan_carbone"."study_correction_deliveries"("copied_study_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_sites_source_study_site_id_study_id_key" ON "bilan_carbone"."study_sites"("source_study_site_id", "study_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD CONSTRAINT "study_correction_deliveries_copied_study_id_fkey" FOREIGN KEY ("copied_study_id") REFERENCES "bilan_carbone"."studies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_sites" ADD CONSTRAINT "study_sites_source_study_site_id_fkey" FOREIGN KEY ("source_study_site_id") REFERENCES "bilan_carbone"."study_sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
