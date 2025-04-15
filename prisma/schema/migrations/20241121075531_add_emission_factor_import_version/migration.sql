-- AlterTable
ALTER TABLE "emission_factors" ADD COLUMN     "version_id" TEXT;

-- CreateTable
CREATE TABLE "emission_factor_import_version" (
    "id" TEXT NOT NULL,
    "intern_id" TEXT NOT NULL,
    "source" "Import" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emission_factor_import_version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emission_factor_import_version_source_intern_id_key" ON "emission_factor_import_version"("source", "intern_id");

-- AddForeignKey
ALTER TABLE "emission_factors" ADD CONSTRAINT "emission_factors_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "emission_factor_import_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
