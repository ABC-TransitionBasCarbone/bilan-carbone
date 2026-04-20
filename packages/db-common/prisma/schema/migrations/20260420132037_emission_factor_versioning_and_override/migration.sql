/*
  Warnings:

  - You are about to drop the column `version_id` on the `emission_factors` table.
    Data is migrated to the new emission_factor_versions join table before the column is dropped.

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

-- AlterTable
ALTER TABLE "bilan_carbone"."emission_factors" DROP COLUMN "version_id";

-- CreateTable
CREATE TABLE "bilan_carbone"."emission_factor_overrides" (
    "id" TEXT NOT NULL,
    "emission_factor_id" TEXT NOT NULL,
    "total_co2" DOUBLE PRECISION NOT NULL,
    "co2f" DOUBLE PRECISION,
    "ch4f" DOUBLE PRECISION,
    "ch4b" DOUBLE PRECISION,
    "n2o" DOUBLE PRECISION,
    "co2b" DOUBLE PRECISION,
    "sf6" DOUBLE PRECISION,
    "hfc" DOUBLE PRECISION,
    "pfc" DOUBLE PRECISION,
    "other_ges" DOUBLE PRECISION,
    "unit" "common"."Unit",
    "status" "bilan_carbone"."EmissionFactorStatus",
    "source" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factor_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bilan_carbone"."emission_factor_override_metadata" (
    "override_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT,
    "attribute" TEXT,
    "frontiere" TEXT,
    "tag" TEXT,
    "location" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factor_override_metadata_pkey" PRIMARY KEY ("override_id","language")
);

-- CreateTable
CREATE TABLE "bilan_carbone"."emission_factor_override_parts" (
    "id" TEXT NOT NULL,
    "override_id" TEXT NOT NULL,
    "type" "bilan_carbone"."EmissionFactorPartType" NOT NULL,
    "total_co2" DOUBLE PRECISION NOT NULL,
    "co2f" DOUBLE PRECISION,
    "ch4f" DOUBLE PRECISION,
    "ch4b" DOUBLE PRECISION,
    "n2o" DOUBLE PRECISION,
    "co2b" DOUBLE PRECISION,
    "sf6" DOUBLE PRECISION,
    "hfc" DOUBLE PRECISION,
    "pfc" DOUBLE PRECISION,
    "other_ges" DOUBLE PRECISION,

    CONSTRAINT "emission_factor_override_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emission_factor_overrides_emission_factor_id_key" ON "bilan_carbone"."emission_factor_overrides"("emission_factor_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_overrides" ADD CONSTRAINT "emission_factor_overrides_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "bilan_carbone"."emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_metadata" ADD CONSTRAINT "emission_factor_override_metadata_override_id_fkey" FOREIGN KEY ("override_id") REFERENCES "bilan_carbone"."emission_factor_overrides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_parts" ADD CONSTRAINT "emission_factor_override_parts_override_id_fkey" FOREIGN KEY ("override_id") REFERENCES "bilan_carbone"."emission_factor_overrides"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX "bilan_carbone"."emission_factor_import_version_source_intern_id_key";

-- AlterTable
ALTER TABLE "bilan_carbone"."emission_factor_import_version" DROP COLUMN "intern_id";

-- CreateIndex
CREATE UNIQUE INDEX "emission_factor_import_version_source_name_key" ON "bilan_carbone"."emission_factor_import_version"("source", "name");

-- CreateTable
CREATE TABLE "bilan_carbone"."emission_factor_override_part_metadata" (
    "override_part_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factor_override_part_metadata_pkey" PRIMARY KEY ("override_part_id","language")
);

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_part_metadata" ADD CONSTRAINT "emission_factor_override_part_metadata_override_part_id_fkey" FOREIGN KEY ("override_part_id") REFERENCES "bilan_carbone"."emission_factor_override_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_metadata" DROP CONSTRAINT "emission_factor_override_metadata_override_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_part_metadata" DROP CONSTRAINT "emission_factor_override_part_metadata_override_part_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_parts" DROP CONSTRAINT "emission_factor_override_parts_override_id_fkey";

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_metadata" ADD CONSTRAINT "emission_factor_override_metadata_override_id_fkey" FOREIGN KEY ("override_id") REFERENCES "bilan_carbone"."emission_factor_overrides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_parts" ADD CONSTRAINT "emission_factor_override_parts_override_id_fkey" FOREIGN KEY ("override_id") REFERENCES "bilan_carbone"."emission_factor_overrides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."emission_factor_override_part_metadata" ADD CONSTRAINT "emission_factor_override_part_metadata_override_part_id_fkey" FOREIGN KEY ("override_part_id") REFERENCES "bilan_carbone"."emission_factor_override_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
