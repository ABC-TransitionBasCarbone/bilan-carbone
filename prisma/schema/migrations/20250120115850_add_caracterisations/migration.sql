-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'Held';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'NotHeldSimpleRent';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'NotHeldOther';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'HeldProcedeed';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'HeldFugitive';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'NotHeldSupported';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'NotHeldNotSupported';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'UsedByIntermediary';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'LandUse';

-- AlterTable
ALTER TABLE "export_rules" ADD COLUMN     "held" TEXT,
ADD COLUMN     "held_fugitive" TEXT,
ADD COLUMN     "held_procedeed" TEXT,
ADD COLUMN     "not_held_not_supported" TEXT,
ADD COLUMN     "not_held_other" TEXT,
ADD COLUMN     "not_held_simple_rent" TEXT,
ADD COLUMN     "not_held_supported" TEXT,
ADD COLUMN     "used_by_intermediary" TEXT,
ADD COLUMN     "land_use" TEXT;

-- AlterTable
ALTER TABLE "study_emission_sources" ADD COLUMN     "recycled_part" INTEGER;
ALTER TABLE "study_emission_sources" ADD CONSTRAINT recycled_part_range CHECK ("recycled_part" >= 0 AND "recycled_part" <= 100);
