-- CreateEnum
CREATE TYPE "EstablishmentType" AS ENUM ('ELEMENTAIRE', 'COLLEGE', 'LYCEE');

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "establishment_type" "EstablishmentType";
