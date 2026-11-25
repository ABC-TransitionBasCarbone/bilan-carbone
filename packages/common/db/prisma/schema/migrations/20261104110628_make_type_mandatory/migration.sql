/*
  Warnings:

  - Made the column `type` on table `course_session` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bilan_carbone"."course_session" ALTER COLUMN "type" SET NOT NULL;
