/*
  Warnings:

  - A unique constraint covering the columns `[course_organism_id,name,environment]` on the table `course_session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `environment` to the `course_session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `course_session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bilan_carbone"."course_session" ADD COLUMN     "environment" "common"."Environment" NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "course_session_course_organism_id_name_environment_key" ON "bilan_carbone"."course_session"("course_organism_id", "name", "environment");
