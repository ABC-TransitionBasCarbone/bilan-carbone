/*
  Warnings:

  - You are about to drop the column `cnc_id` on the `sites` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sites" DROP CONSTRAINT "sites_cnc_id_fkey";

-- AlterTable
ALTER TABLE "sites" DROP COLUMN "cnc_id",
ADD COLUMN     "cncId" TEXT;
