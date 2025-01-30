-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onboarder_id" TEXT;

UPDATE "organizations" SET "onboarded" = true;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_onboarder_id_fkey" FOREIGN KEY ("onboarder_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
