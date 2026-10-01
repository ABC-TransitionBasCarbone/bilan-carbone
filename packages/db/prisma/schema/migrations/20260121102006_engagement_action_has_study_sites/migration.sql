-- AlterTable
ALTER TABLE "study_sites" ADD COLUMN     "engagementActionId" TEXT;

-- AddForeignKey
ALTER TABLE "study_sites" ADD CONSTRAINT "study_sites_engagementActionId_fkey" FOREIGN KEY ("engagementActionId") REFERENCES "EngagementAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
