/*
  Warnings:

  - A unique constraint covering the columns `[emission_factor_id,type]` on the table `emission_factor_parts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imported_id,version_id]` on the table `emission_factors` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "emission_factor_parts_emission_factor_id_type_key" ON "emission_factor_parts"("emission_factor_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "emission_factors_imported_id_version_id_key" ON "emission_factors"("imported_id", "version_id");
