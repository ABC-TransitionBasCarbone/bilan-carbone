-- DropForeignKey
ALTER TABLE "public"."actions" DROP CONSTRAINT "actions_transition_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."external_studies" DROP CONSTRAINT "external_studies_transition_plan_id_fkey";

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_transition_plan_id_fkey" FOREIGN KEY ("transition_plan_id") REFERENCES "transition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_studies" ADD CONSTRAINT "external_studies_transition_plan_id_fkey" FOREIGN KEY ("transition_plan_id") REFERENCES "transition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
