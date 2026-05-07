/* CUSTOM MIGRATION NOT GENERATED WITH PRISMA */
-- Create schema if needed
CREATE SCHEMA IF NOT EXISTS "common";

-- Move enum
ALTER TYPE "bilan_carbone"."UserSource"
SET SCHEMA "common";

-- Move table
ALTER TABLE "bilan_carbone"."users"
SET SCHEMA "common";

-- Update deactivable_features_statuses enum column type
ALTER TABLE "bilan_carbone"."deactivable_features_statuses"
ALTER COLUMN "deactivated_sources"
TYPE "common"."UserSource"[]
USING "deactivated_sources"::text[]::"common"."UserSource"[];