/*
  Warnings:

  - The values [LandUse] on the enum `EmissionSourceCaracterisation` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `land_use` on the `export_rules` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmissionSourceCaracterisation_new" AS ENUM ('Operated', 'NotOperated', 'OperatedProcedeed', 'OperatedFugitive', 'NotOperatedSupported', 'NotOperatedNotSupported', 'Rented', 'FinalClient', 'Held', 'NotHeldSimpleRent', 'NotHeldOther', 'HeldProcedeed', 'HeldFugitive', 'NotHeldSupported', 'NotHeldNotSupported', 'UsedByIntermediary');
ALTER TABLE "study_emission_sources" ALTER COLUMN "caracterisation" TYPE "EmissionSourceCaracterisation_new" USING ("caracterisation"::text::"EmissionSourceCaracterisation_new");
ALTER TYPE "EmissionSourceCaracterisation" RENAME TO "EmissionSourceCaracterisation_old";
ALTER TYPE "EmissionSourceCaracterisation_new" RENAME TO "EmissionSourceCaracterisation";
DROP TYPE "EmissionSourceCaracterisation_old";
COMMIT;

-- AlterTable
ALTER TABLE "export_rules" DROP COLUMN "land_use";
