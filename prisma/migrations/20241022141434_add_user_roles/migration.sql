-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('INITIAL', 'STANDARD', 'ADVANCED');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "adminRole" "AdminRole",
ADD COLUMN     "training" "TrainingStatus";
