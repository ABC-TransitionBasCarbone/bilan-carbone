/*
  Warnings:

  - You are about to drop the column `name` on the `secten_version` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[year]` on the table `secten_version` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "secten_version_name_key";

-- AlterTable
ALTER TABLE "secten_version" DROP COLUMN "name";

-- CreateIndex
CREATE UNIQUE INDEX "secten_version_year_key" ON "secten_version"("year");
