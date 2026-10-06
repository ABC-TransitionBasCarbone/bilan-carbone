/*
  Warnings:

  - A unique constraint covering the columns `[model_campaign_id]` on the table `organization_versions_mip` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `model_campaign_id` to the `organization_versions_mip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mip"."organization_versions_mip" ADD COLUMN     "model_campaign_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "mip"."model_campaigns" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "model" JSONB NOT NULL,

    CONSTRAINT "model_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_versions_mip_model_campaign_id_key" ON "mip"."organization_versions_mip"("model_campaign_id");

-- AddForeignKey
ALTER TABLE "mip"."organization_versions_mip" ADD CONSTRAINT "organization_versions_mip_model_campaign_id_fkey" FOREIGN KEY ("model_campaign_id") REFERENCES "mip"."model_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
