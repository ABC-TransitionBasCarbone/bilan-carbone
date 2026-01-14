/*
  Warnings:

  - The values [SNBC] on the enum `trajectory_type` will be removed. If these variants are still used in the database, this will fail.

*/

-- Delete all trajectories with SNBC type (objectives will be deleted automatically due to CASCADE)
DELETE FROM "trajectories" WHERE "type" = 'SNBC';

-- AlterEnum
BEGIN;
CREATE TYPE "trajectory_type_new" AS ENUM ('SBTI_15', 'SBTI_WB2C', 'SNBC_GENERAL', 'SNBC_SECTORAL', 'CUSTOM');
ALTER TABLE "trajectories" ALTER COLUMN "type" TYPE "trajectory_type_new" USING ("type"::text::"trajectory_type_new");
ALTER TYPE "trajectory_type" RENAME TO "trajectory_type_old";
ALTER TYPE "trajectory_type_new" RENAME TO "trajectory_type";
DROP TYPE "public"."trajectory_type_old";
COMMIT;
