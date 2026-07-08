/*
  Warnings:

  - Added the required column `created_by_account_mip_id` to the `campaigns` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "mip"."CampaignRole" AS ENUM ('Validator', 'Editor', 'Reader');

-- AlterTable
ALTER TABLE "mip"."campaigns" ADD COLUMN     "created_by_account_mip_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "mip"."accounts_on_campaign" (
    "stcampaignd" TEXT NOT NULL,
    "account_mip_id" TEXT NOT NULL,
    "role" "mip"."CampaignRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_on_campaign_pkey" PRIMARY KEY ("stcampaignd","account_mip_id")
);

-- AddForeignKey
ALTER TABLE "mip"."campaigns" ADD CONSTRAINT "campaigns_created_by_account_mip_id_fkey" FOREIGN KEY ("created_by_account_mip_id") REFERENCES "mip"."accounts_mip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mip"."accounts_on_campaign" ADD CONSTRAINT "accounts_on_campaign_stcampaignd_fkey" FOREIGN KEY ("stcampaignd") REFERENCES "mip"."campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mip"."accounts_on_campaign" ADD CONSTRAINT "accounts_on_campaign_account_mip_id_fkey" FOREIGN KEY ("account_mip_id") REFERENCES "mip"."accounts_mip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
