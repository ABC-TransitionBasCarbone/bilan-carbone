-- CreateEnum
CREATE TYPE "StudyResultUnit" AS ENUM ('K', 'T');

-- AlterTable
ALTER TABLE "user_application_settings" ADD COLUMN     "study_unit" "StudyResultUnit" NOT NULL DEFAULT 'T';
