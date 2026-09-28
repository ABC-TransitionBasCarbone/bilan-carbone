-- CreateEnum
CREATE TYPE "EngagementPhase" AS ENUM ('AwarnessAndOutreach', 'Empowerment', 'CoConstruction', 'FeedbackAndCommunication');

-- CreateTable
CREATE TABLE "EngagementAction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "target" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "phase" "EngagementPhase" NOT NULL,
    "description" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EngagementAction" ADD CONSTRAINT "EngagementAction_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
