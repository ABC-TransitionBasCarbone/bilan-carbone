/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `course_organism` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_version_id]` on the table `course_session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_code_id]` on the table `course_session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trainee_code]` on the table `session_code` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[professor_code]` on the table `session_code` will be added. If there are existing duplicate values, this will fail.
  - Made the column `organization_version_id` on table `course_session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `course_organism_id` on table `course_session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `session_code_id` on table `course_session` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "bilan_carbone"."course_session" DROP CONSTRAINT "course_session_course_organism_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."course_session" DROP CONSTRAINT "course_session_organization_version_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."course_session" DROP CONSTRAINT "course_session_session_code_id_fkey";

-- AlterTable
ALTER TABLE "bilan_carbone"."course_session" ALTER COLUMN "organization_version_id" SET NOT NULL,
ALTER COLUMN "course_organism_id" SET NOT NULL,
ALTER COLUMN "session_code_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "course_organism_name_key" ON "bilan_carbone"."course_organism"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_session_organization_version_id_key" ON "bilan_carbone"."course_session"("organization_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_session_session_code_id_key" ON "bilan_carbone"."course_session"("session_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_code_trainee_code_key" ON "bilan_carbone"."session_code"("trainee_code");

-- CreateIndex
CREATE UNIQUE INDEX "session_code_professor_code_key" ON "bilan_carbone"."session_code"("professor_code");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_organization_version_id_fkey" FOREIGN KEY ("organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_course_organism_id_fkey" FOREIGN KEY ("course_organism_id") REFERENCES "bilan_carbone"."course_organism"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_session_code_id_fkey" FOREIGN KEY ("session_code_id") REFERENCES "bilan_carbone"."session_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
