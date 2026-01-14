-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "simplified" BOOLEAN NOT NULL DEFAULT false;

UPDATE studies
SET simplified = true
WHERE organization_version_id IN (
	SELECT id FROM organization_versions WHERE environment IN ('CUT', 'CLICKSON')
) 
