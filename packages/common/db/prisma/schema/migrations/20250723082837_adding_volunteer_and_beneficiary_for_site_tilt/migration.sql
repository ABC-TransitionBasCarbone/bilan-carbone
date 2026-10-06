-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "beneficiary_number" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "volunteer_number" INTEGER NOT NULL DEFAULT 0;
