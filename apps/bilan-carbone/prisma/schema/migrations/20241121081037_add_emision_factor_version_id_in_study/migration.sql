/*
  Warnings:

  - Added the required column `version_id` to the `studies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "version_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "emission_factor_import_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
