-- AlterTable
ALTER TABLE "actions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "external_studies" (
    "id" TEXT NOT NULL,
    "transition_plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalCo2" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_studies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "external_studies" ADD CONSTRAINT "external_studies_transition_plan_id_fkey" FOREIGN KEY ("transition_plan_id") REFERENCES "transition_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
