-- AlterTable
ALTER TABLE "deactivable_features_statuses" ADD COLUMN     "deactivated_environments" "Environment"[] DEFAULT ARRAY[]::"Environment"[],
ADD COLUMN     "deactivated_sources" "UserSource"[] DEFAULT ARRAY[]::"UserSource"[];
