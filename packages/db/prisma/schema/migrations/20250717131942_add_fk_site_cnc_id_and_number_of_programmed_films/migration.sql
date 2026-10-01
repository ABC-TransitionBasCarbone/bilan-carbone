-- AlterTable
ALTER TABLE "cncs" ADD COLUMN     "number_of_programmed_films" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_cncId_fkey" FOREIGN KEY ("cncId") REFERENCES "cncs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
