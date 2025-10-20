/*
  Warnings:

  - You are about to drop the column `study_id` on the `actions` table. All the data in the column will be lost.
  - Added the required column `transition_plan_id` to the `actions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."actions" DROP CONSTRAINT "actions_study_id_fkey";

-- AlterTable
ALTER TABLE "actions" DROP COLUMN "study_id",
ADD COLUMN     "reduction_end_year" TEXT,
ADD COLUMN     "transition_plan_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_transition_plan_id_fkey" FOREIGN KEY ("transition_plan_id") REFERENCES "transition_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
