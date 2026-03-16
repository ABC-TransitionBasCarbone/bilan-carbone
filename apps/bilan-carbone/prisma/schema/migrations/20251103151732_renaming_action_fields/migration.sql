-- AlterTable: Rename columns to preserve data
ALTER TABLE "actions"
  RENAME COLUMN "action_porter" TO "owner";

ALTER TABLE "actions"
  RENAME COLUMN "implementation_aim" TO "implementation_goal";

ALTER TABLE "actions"
  RENAME COLUMN "follow_up_aim" TO "follow_up_goal";

ALTER TABLE "actions"
  RENAME COLUMN "performance_aim" TO "performance_goal";

-- AlterTable: Add new priority column
ALTER TABLE "actions"
  ADD COLUMN "priority" INTEGER;
