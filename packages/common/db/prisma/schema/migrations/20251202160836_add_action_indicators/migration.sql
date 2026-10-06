-- CreateEnum
CREATE TYPE "action_indicator_type" AS ENUM ('Implementation', 'FollowUp', 'Performance');

-- CreateTable
CREATE TABLE "action_indicators" (
    "id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "type" "action_indicator_type" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "action_indicators_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "action_indicators" ADD CONSTRAINT "action_indicators_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
