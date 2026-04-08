-- AlterEnum
ALTER TYPE "Unit" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "emission_factors" ADD COLUMN     "customUnit" TEXT;
