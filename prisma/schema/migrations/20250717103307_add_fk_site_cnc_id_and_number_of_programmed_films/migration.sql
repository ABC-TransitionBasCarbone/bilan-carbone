/*
  Warnings:

  - Made the column `number_of_programmed_films` on table `cncs` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cncs" ALTER COLUMN "number_of_programmed_films" SET NOT NULL,
ALTER COLUMN "number_of_programmed_films" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_cncId_fkey" FOREIGN KEY ("cncId") REFERENCES "cncs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
