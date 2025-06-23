/*
  Warnings:

  - You are about to drop the column `study_id` on the `opening_hours` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfOpenDays` on the `studies` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfSessions` on the `studies` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfTickets` on the `studies` table. All the data in the column will be lost.
  - Added the required column `study_site_id` to the `opening_hours` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "opening_hours" DROP CONSTRAINT "opening_hours_study_id_fkey";

-- AlterTable
ALTER TABLE "opening_hours" DROP COLUMN "study_id",
ADD COLUMN     "study_site_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "studies" DROP COLUMN "numberOfOpenDays",
DROP COLUMN "numberOfSessions",
DROP COLUMN "numberOfTickets";

-- AlterTable
ALTER TABLE "study_sites" ADD COLUMN     "numberOfOpenDays" INTEGER,
ADD COLUMN     "numberOfSessions" INTEGER,
ADD COLUMN     "numberOfTickets" INTEGER;

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_study_site_id_fkey" FOREIGN KEY ("study_site_id") REFERENCES "study_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
