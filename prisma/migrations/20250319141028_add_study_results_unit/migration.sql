-- CreateEnum
CREATE TYPE "StudyResultUnit" AS ENUM ('K', 'T');

-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "results_unit" "StudyResultUnit" NOT NULL DEFAULT 'T';
