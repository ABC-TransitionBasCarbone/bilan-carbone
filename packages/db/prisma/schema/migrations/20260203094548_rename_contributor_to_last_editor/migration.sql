/* CUSTOM MIGRATION NOT GENERATED WITH PRISMA */

-- DropForeignKey
ALTER TABLE "public"."study_emission_sources"
DROP CONSTRAINT IF EXISTS "study_emission_sources_contributor_account_id_fkey";

-- Rename column
ALTER TABLE "public"."study_emission_sources"
RENAME COLUMN "contributor_account_id" TO "last_editor_account_id";

-- AddForeignKey
ALTER TABLE "public"."study_emission_sources"
ADD CONSTRAINT "study_emission_sources_last_editor_account_id_fkey"
FOREIGN KEY ("last_editor_account_id")
REFERENCES "public"."accounts"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
