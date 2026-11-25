/*
  Warnings:

  - The primary key for the `course_session_trainee_organization` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `course_session_trainee_removal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[course_session_id,organization_version_id]` on the table `course_session_trainee_organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[course_session_id,organization_version_id]` on the table `course_session_trainee_removal` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `course_session_trainee_organization` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `course_session_trainee_removal` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "bilan_carbone"."AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'NOT_DISCLOSED');

-- AlterTable
ALTER TABLE "bilan_carbone"."course_session_trainee_organization" DROP CONSTRAINT "course_session_trainee_organization_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "course_session_trainee_organization_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "bilan_carbone"."course_session_trainee_removal" DROP CONSTRAINT "course_session_trainee_removal_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "course_session_trainee_removal_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "bilan_carbone"."attendance" (
    "id" TEXT NOT NULL,
    "course_session_trainee_organization_id" TEXT NOT NULL,
    "status" "bilan_carbone"."AttendanceStatus" NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_course_session_trainee_organization_id_key" ON "bilan_carbone"."attendance"("course_session_trainee_organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_session_trainee_organization_course_session_id_organ_key" ON "bilan_carbone"."course_session_trainee_organization"("course_session_id", "organization_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_session_trainee_removal_course_session_id_organizati_key" ON "bilan_carbone"."course_session_trainee_removal"("course_session_id", "organization_version_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."attendance" ADD CONSTRAINT "attendance_course_session_trainee_organization_id_fkey" FOREIGN KEY ("course_session_trainee_organization_id") REFERENCES "bilan_carbone"."course_session_trainee_organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
