/*
  Warnings:

  - The primary key for the `study_exports` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "study_exports" DROP CONSTRAINT "study_exports_pkey",
ADD CONSTRAINT "study_exports_pkey" PRIMARY KEY ("study_id", "type", "control");
