-- CreateEnum
CREATE TYPE "mip"."CampaignStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "mip"."campaigns" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "status" "mip"."CampaignStatus" NOT NULL DEFAULT 'OPEN',
    "model_campaign_id" TEXT NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mip"."responses" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mip"."campaigns" ADD CONSTRAINT "campaigns_model_campaign_id_fkey" FOREIGN KEY ("model_campaign_id") REFERENCES "mip"."model_campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mip"."responses" ADD CONSTRAINT "responses_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "mip"."campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
