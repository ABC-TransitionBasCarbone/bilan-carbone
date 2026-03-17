-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'OperatedCAS';
ALTER TYPE "EmissionSourceCaracterisation" ADD VALUE 'HeldCAS';

ALTER TABLE "export_rules" ADD COLUMN     "held_cas" TEXT,
ADD COLUMN     "operated_cas" TEXT;
