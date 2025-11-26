-- CreateTable
CREATE TABLE "actions" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sub_steps" TEXT NOT NULL,
    "detailedDescription" TEXT NOT NULL,
    "potentialDeduction" "ActionPotentialDeduction" NOT NULL,
    "reductionValue" INTEGER,
    "reduction_start_year" TEXT,
    "reduction_effects_start" TEXT,
    "action_porter" TEXT,
    "necessary_budget" INTEGER,
    "necesssary_ressources" TEXT,
    "implementation_description" TEXT,
    "implementation_aim" INTEGER,
    "follow_up_description" TEXT,
    "follow_up_aim" INTEGER,
    "performance_description" TEXT,
    "performance_aim" INTEGER,
    "facilitators_and_abstacles" TEXT,
    "additional_information" TEXT,
    "nature" "ActionNature"[],
    "category" "ActionCategory"[],
    "relevance" "ActionRelevance"[],

    CONSTRAINT "actions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "actions" ADD CONSTRAINT "actions_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
