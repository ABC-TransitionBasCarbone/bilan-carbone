/*
  Warnings:

  - You are about to drop the column `professor_id` on the `course_session` table. All the data in the column will be lost.
  - You are about to drop the `course_session_trainee` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "bilan_carbone"."CourseSessionTraineeOrganizationStatus" AS ENUM ('INACTIVE', 'ACTIVE');

-- DropForeignKey
ALTER TABLE "bilan_carbone"."course_session" DROP CONSTRAINT "course_session_professor_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."course_session_trainee" DROP CONSTRAINT "course_session_trainee_account_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."course_session_trainee" DROP CONSTRAINT "course_session_trainee_course_session_id_fkey";

-- AlterTable
ALTER TABLE "bilan_carbone"."course_session" DROP COLUMN "professor_id",
ADD COLUMN     "professor_organization_version_id" TEXT;

-- DropTable
DROP TABLE "bilan_carbone"."course_session_trainee";

-- CreateTable
CREATE TABLE "bilan_carbone"."course_session_trainee_organization" (
    "course_session_id" TEXT NOT NULL,
    "organization_version_id" TEXT NOT NULL,
    "is_active" "bilan_carbone"."CourseSessionTraineeOrganizationStatus" NOT NULL DEFAULT 'INACTIVE',

    CONSTRAINT "course_session_trainee_organization_pkey" PRIMARY KEY ("course_session_id","organization_version_id")
);

-- CreateIndex
CREATE INDEX "course_session_trainee_organization_organization_version_id_idx" ON "bilan_carbone"."course_session_trainee_organization"("organization_version_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_professor_organization_version_id_fkey" FOREIGN KEY ("professor_organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session_trainee_organization" ADD CONSTRAINT "course_session_trainee_organization_course_session_id_fkey" FOREIGN KEY ("course_session_id") REFERENCES "bilan_carbone"."course_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session_trainee_organization" ADD CONSTRAINT "course_session_trainee_organization_organization_version_i_fkey" FOREIGN KEY ("organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
