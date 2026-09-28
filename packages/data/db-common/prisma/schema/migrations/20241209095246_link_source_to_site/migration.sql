/*
  Warnings:

  - Added the required column `site_id` to the `study_emission_sources` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "study_emission_sources" ADD COLUMN     "site_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "StudySite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
