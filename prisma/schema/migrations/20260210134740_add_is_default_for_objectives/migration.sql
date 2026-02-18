-- AlterTable
ALTER TABLE "objectives" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- Update existing objectives that don't have any scope data to be isDefault=true
-- These are the ones created through trajectory creation
UPDATE objectives
SET is_default = true
WHERE id NOT IN (
  SELECT DISTINCT objective_id FROM objective_sites
  UNION
  SELECT DISTINCT objective_id FROM objective_tags
  UNION
  SELECT DISTINCT objective_id FROM objective_subposts
);
