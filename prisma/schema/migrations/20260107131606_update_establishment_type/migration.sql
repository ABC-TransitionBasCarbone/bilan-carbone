/*
  Warnings:

  - The values [ELEMENTAIRE] on the enum `EstablishmentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstablishmentType_new" AS ENUM ('COLLEGE', 'LYCEE_GENERAL', 'LYCEE_PRO', 'LYCEE_PRO_AGRICOLE', 'ETABLISSEMENT_FR_ETRANGER');
ALTER TABLE "sites" ALTER COLUMN "establishment_type" TYPE "EstablishmentType_new" USING ("establishment_type"::text::"EstablishmentType_new");
ALTER TYPE "EstablishmentType" RENAME TO "EstablishmentType_old";
ALTER TYPE "EstablishmentType_new" RENAME TO "EstablishmentType";
DROP TYPE "public"."EstablishmentType_old";
COMMIT;
