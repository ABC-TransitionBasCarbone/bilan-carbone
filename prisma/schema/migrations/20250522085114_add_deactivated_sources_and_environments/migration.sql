/*
  Warnings:

  - You are about to drop the column `deactivated_features` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deactivable_features_statuses" ADD COLUMN     "deactivated_environments" "Environment"[] DEFAULT ARRAY[]::"Environment"[],
ADD COLUMN     "deactivated_sources" "UserSource"[] DEFAULT ARRAY[]::"UserSource"[];
