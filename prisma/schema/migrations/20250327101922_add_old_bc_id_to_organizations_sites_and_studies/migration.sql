-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "old_bc_id" TEXT;

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "old_bc_id" TEXT;

-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "old_bc_id" TEXT;
