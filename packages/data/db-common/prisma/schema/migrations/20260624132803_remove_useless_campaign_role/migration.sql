/*
  Warnings:

  - You are about to drop the column `role` on the `accounts_on_campaign` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mip"."accounts_on_campaign" DROP COLUMN "role";

-- DropEnum
DROP TYPE "mip"."CampaignRole";
