-- CreateTable
CREATE TABLE "transition_plans" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transition_plan_studies" (
    "transition_plan_id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transition_plan_studies_pkey" PRIMARY KEY ("transition_plan_id","study_id")
);

-- AddForeignKey
ALTER TABLE "transition_plans" ADD CONSTRAINT "transition_plans_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transition_plan_studies" ADD CONSTRAINT "transition_plan_studies_transition_plan_id_fkey" FOREIGN KEY ("transition_plan_id") REFERENCES "transition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transition_plan_studies" ADD CONSTRAINT "transition_plan_studies_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterEnum
ALTER TYPE "DeactivatableFeature" ADD VALUE 'TransitionPlan';
