/*
  Warnings:

  - A unique constraint covering the columns `[organization_version_id,source_template_study_id]` on the table `studies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[environment,template,study_id]` on the table `study_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "bilan_carbone"."study_templates_environment_template_key";

-- AlterTable
ALTER TABLE "bilan_carbone"."studies" ADD COLUMN     "source_template_study_id" TEXT;

-- CreateIndex
CREATE INDEX "course_session_professor_organization_version_id_idx" ON "bilan_carbone"."course_session"("professor_organization_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "studies_organization_version_id_source_template_study_id_key" ON "bilan_carbone"."studies"("organization_version_id", "source_template_study_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_templates_environment_template_study_id_key" ON "bilan_carbone"."study_templates"("environment", "template", "study_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."studies" ADD CONSTRAINT "studies_source_template_study_id_fkey" FOREIGN KEY ("source_template_study_id") REFERENCES "bilan_carbone"."studies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
