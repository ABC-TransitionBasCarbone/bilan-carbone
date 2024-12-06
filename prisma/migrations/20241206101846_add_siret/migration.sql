-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "siret" TEXT;

-- Manual constraint (not managed by Prisma)
ALTER TABLE organizations
ADD CONSTRAINT siret_required_if_no_parent
CHECK (parent_id IS NOT NULL OR siret IS NOT NULL);