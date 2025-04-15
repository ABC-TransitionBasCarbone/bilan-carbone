-- CreateEnum
CREATE TYPE "UserSource" AS ENUM ('CRON', 'TUNISIE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "source" "UserSource" NOT NULL DEFAULT 'CRON';
