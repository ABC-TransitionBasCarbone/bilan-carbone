/* CUSTOM MIGRATION NOT GENERATED WITH PRISMA */
-- AlterTable

ALTER TABLE "EngagementAction"
ADD COLUMN "targets" TEXT[];

UPDATE "EngagementAction"
SET "targets" = CASE
  WHEN "target" IS NULL THEN '{}'
  ELSE ARRAY["target"]
END;

ALTER TABLE "EngagementAction"
ALTER COLUMN "targets" SET NOT NULL;

ALTER TABLE "EngagementAction"
DROP COLUMN "target";
