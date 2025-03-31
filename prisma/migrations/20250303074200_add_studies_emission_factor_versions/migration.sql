/*
  Warnings:

  - You are about to drop the column `version_id` on the `studies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_version_id_fkey";

-- AlterTable
ALTER TABLE "studies" DROP COLUMN "version_id";

-- CreateTable
CREATE TABLE "study_emission_factor_versions" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "import_version_id" TEXT NOT NULL,
    "source" "Import" NOT NULL,

    CONSTRAINT "study_emission_factor_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_emission_factor_versions_study_id_source_key" ON "study_emission_factor_versions"("study_id", "source");

-- AddForeignKey
ALTER TABLE "study_emission_factor_versions" ADD CONSTRAINT "study_emission_factor_versions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_factor_versions" ADD CONSTRAINT "study_emission_factor_versions_import_version_id_fkey" FOREIGN KEY ("import_version_id") REFERENCES "emission_factor_import_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
