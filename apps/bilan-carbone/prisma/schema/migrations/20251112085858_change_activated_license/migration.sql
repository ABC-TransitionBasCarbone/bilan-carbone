-- AlterTable
ALTER TABLE "organization_versions"
ADD COLUMN "new_activated_licence" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

UPDATE "organization_versions"
SET "new_activated_licence" = ARRAY[2025]
WHERE "activated_licence" = true;

ALTER TABLE "organization_versions" DROP COLUMN "activated_licence";

ALTER TABLE "organization_versions"
RENAME COLUMN "new_activated_licence" TO "activated_licence";
