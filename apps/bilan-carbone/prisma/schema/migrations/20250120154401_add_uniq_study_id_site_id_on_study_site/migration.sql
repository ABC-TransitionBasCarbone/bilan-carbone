/*
  Warnings:

  - A unique constraint covering the columns `[study_id,site_id]` on the table `study_sites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "study_sites_study_id_site_id_key" ON "study_sites"("study_id", "site_id");
