/*
  Warnings:

  - You are about to drop the column `limit` on the `contributors` table. All the data in the column will be lost.
  - You are about to drop the column `date_limite` on the `study_emission_sources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contributors" DROP COLUMN "limit";

-- AlterTable
ALTER TABLE "study_emission_sources" DROP COLUMN "date_limite";
