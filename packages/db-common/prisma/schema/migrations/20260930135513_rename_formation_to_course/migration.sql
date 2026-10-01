/*
  Warnings:

  - The values [FORMATION_BC,FORMATION_TILT] on the enum `Environment` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "common"."Environment_new" AS ENUM ('BC', 'CUT', 'TILT', 'CLICKSON', 'MIP', 'COURSE_BC', 'COURSE_TILT');
ALTER TABLE "bilan_carbone"."actualities" ALTER COLUMN "environment" DROP DEFAULT;
ALTER TABLE "bilan_carbone"."deactivable_features_statuses" ALTER COLUMN "deactivated_environments" DROP DEFAULT;
ALTER TABLE "mip"."accounts_mip" ALTER COLUMN "environment" DROP DEFAULT;
ALTER TABLE "mip"."organization_versions_mip" ALTER COLUMN "environment" DROP DEFAULT;
ALTER TABLE "bilan_carbone"."actualities" ALTER COLUMN "environment" TYPE "common"."Environment_new" USING ("environment"::text::"common"."Environment_new");
ALTER TABLE "bilan_carbone"."deactivable_features_statuses" ALTER COLUMN "deactivated_environments" TYPE "common"."Environment_new"[] USING ("deactivated_environments"::text::"common"."Environment_new"[]);
ALTER TABLE "bilan_carbone"."organization_versions" ALTER COLUMN "environment" TYPE "common"."Environment_new" USING ("environment"::text::"common"."Environment_new");
ALTER TABLE "bilan_carbone"."study_templates" ALTER COLUMN "environment" TYPE "common"."Environment_new" USING ("environment"::text::"common"."Environment_new");
ALTER TABLE "bilan_carbone"."accounts" ALTER COLUMN "environment" TYPE "common"."Environment_new" USING ("environment"::text::"common"."Environment_new");
ALTER TABLE "mip"."organization_versions_mip" ALTER COLUMN "environment" TYPE "common"."Environment_new" USING ("environment"::text::"common"."Environment_new");
ALTER TABLE "mip"."accounts_mip" ALTER COLUMN "environment" TYPE "common"."Environment_new" USING ("environment"::text::"common"."Environment_new");
ALTER TYPE "common"."Environment" RENAME TO "Environment_old";
ALTER TYPE "common"."Environment_new" RENAME TO "Environment";
DROP TYPE "common"."Environment_old";
ALTER TABLE "bilan_carbone"."actualities" ALTER COLUMN "environment" SET DEFAULT 'BC';
ALTER TABLE "bilan_carbone"."deactivable_features_statuses" ALTER COLUMN "deactivated_environments" SET DEFAULT ARRAY[]::"common"."Environment"[];
ALTER TABLE "mip"."accounts_mip" ALTER COLUMN "environment" SET DEFAULT 'MIP';
ALTER TABLE "mip"."organization_versions_mip" ALTER COLUMN "environment" SET DEFAULT 'MIP';
COMMIT;
