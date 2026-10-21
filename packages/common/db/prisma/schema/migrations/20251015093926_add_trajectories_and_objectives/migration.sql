-- CreateEnum
CREATE TYPE "trajectory_type" AS ENUM ('SBTI_15', 'SBTI_WB2C', 'SNBC', 'CUSTOM');

-- CreateTable
CREATE TABLE "trajectories" (
    "id" TEXT NOT NULL,
    "transition_plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "trajectory_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trajectories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL,
    "trajectory_id" TEXT NOT NULL,
    "target_year" INTEGER NOT NULL,
    "reduction_rate" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objectives_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trajectories" ADD CONSTRAINT "trajectories_transition_plan_id_fkey" FOREIGN KEY ("transition_plan_id") REFERENCES "transition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_trajectory_id_fkey" FOREIGN KEY ("trajectory_id") REFERENCES "trajectories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
