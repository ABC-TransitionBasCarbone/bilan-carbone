-- CreateEnum
CREATE TYPE "SiteCAUnit" AS ENUM ('U', 'K', 'M');

-- AlterTable
ALTER TABLE "user_application_settings" ADD COLUMN     "ca_unit" "SiteCAUnit" NOT NULL DEFAULT 'K';
