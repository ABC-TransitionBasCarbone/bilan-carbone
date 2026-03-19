-- AlterTable: add year to secten_version with default 2024 for existing rows
ALTER TABLE "secten_version" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2024;

-- Remove the default constraint after backfill (year is required going forward)
ALTER TABLE "secten_version" ALTER COLUMN "year" DROP DEFAULT;

-- AlterTable: add secten_version_id to transition_plans
ALTER TABLE "transition_plans" ADD COLUMN "secten_version_id" TEXT;

-- Backfill: link all existing transition_plans to the secten_version with year = 2024
UPDATE "transition_plans"
SET "secten_version_id" = (
  SELECT "id" FROM "secten_version" WHERE "year" = 2024 ORDER BY "created_at" DESC LIMIT 1
)
WHERE "secten_version_id" IS NULL;

-- AddForeignKey
ALTER TABLE "transition_plans" ADD CONSTRAINT "transition_plans_secten_version_id_fkey"
  FOREIGN KEY ("secten_version_id") REFERENCES "secten_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
