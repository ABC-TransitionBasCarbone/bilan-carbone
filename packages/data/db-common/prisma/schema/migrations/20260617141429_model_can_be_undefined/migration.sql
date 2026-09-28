-- DropForeignKey
ALTER TABLE "mip"."organization_versions_mip" DROP CONSTRAINT "organization_versions_mip_model_campaign_id_fkey";

-- AlterTable
ALTER TABLE "mip"."organization_versions_mip" ALTER COLUMN "model_campaign_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "mip"."organization_versions_mip" ADD CONSTRAINT "organization_versions_mip_model_campaign_id_fkey" FOREIGN KEY ("model_campaign_id") REFERENCES "mip"."model_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
