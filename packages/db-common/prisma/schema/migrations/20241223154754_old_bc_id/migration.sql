-- AlterTable
ALTER TABLE "emission_factor_parts" ADD COLUMN     "old_bc_id" TEXT;

-- AlterTable
ALTER TABLE "emission_factors" ADD COLUMN     "old_bc_id" TEXT;
