-- DropForeignKey
ALTER TABLE "deactivable_features_statuses" DROP CONSTRAINT "deactivable_features_statuses_updated_by_fkey";

-- AddForeignKey
ALTER TABLE "deactivable_features_statuses" ADD CONSTRAINT "deactivable_features_statuses_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
