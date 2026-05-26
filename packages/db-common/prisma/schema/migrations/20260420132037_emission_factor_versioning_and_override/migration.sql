/*
  Warnings:

  - You are about to drop the column `version_id` on the `emission_factors` table.
    Data is migrated to the new emission_factor_versions join table before the column is dropped.

  - You are about to drop the column `intern_id` on the `emission_factor_import_version` table.

*/

-- CreateTable (before dropping version_id so we can migrate the data)
CREATE TABLE "bilan_carbone"."emission_factor_versions" (
    "emission_factor_id" TEXT NOT NULL,
    "import_version_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factor_versions_pkey" PRIMARY KEY ("emission_factor_id","import_version_id")
);

-- CreateIndex
CREATE INDEX "emission_factor_versions_import_version_id_idx" ON "bilan_carbone"."emission_factor_versions"("import_version_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_versions" ADD CONSTRAINT "emission_factor_versions_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "bilan_carbone"."emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_versions" ADD CONSTRAINT "emission_factor_versions_import_version_id_fkey" FOREIGN KEY ("import_version_id") REFERENCES "bilan_carbone"."emission_factor_import_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate existing data: populate join table from version_id column before dropping it
INSERT INTO "bilan_carbone"."emission_factor_versions" ("emission_factor_id", "import_version_id", "created_at")
SELECT "id", "version_id", "created_at"
FROM "bilan_carbone"."emission_factors"
WHERE "version_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "bilan_carbone"."emission_factors" DROP CONSTRAINT "emission_factors_version_id_fkey";

-- AlterTable: drop version_id, add raw CSV fields
ALTER TABLE "bilan_carbone"."emission_factors"
  DROP COLUMN "version_id",
  ADD COLUMN "imported_raw_csv" TEXT,
  ADD COLUMN "override_raw_csv" TEXT;

-- DropIndex
DROP INDEX "bilan_carbone"."emission_factor_import_version_source_intern_id_key";

-- AlterTable
ALTER TABLE "bilan_carbone"."emission_factor_import_version" DROP COLUMN "intern_id";

-- CreateIndex
CREATE UNIQUE INDEX "emission_factor_import_version_source_name_key" ON "bilan_carbone"."emission_factor_import_version"("source", "name");
