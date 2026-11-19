/*
  Warnings:

  - Made the column `copied_study_id` on table `study_correction_deliveries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" DROP CONSTRAINT "study_correction_deliveries_copied_study_id_fkey";

-- AlterTable
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ALTER COLUMN "copied_study_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD CONSTRAINT "study_correction_deliveries_copied_study_id_fkey" FOREIGN KEY ("copied_study_id") REFERENCES "bilan_carbone"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
