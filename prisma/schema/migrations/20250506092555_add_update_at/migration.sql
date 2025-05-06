/*
  Warnings:

  - Added the required column `updated_at` to the `contributors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `emission_factor_import_version` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `emission_factor_part_metadata` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `emission_metadata` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `export_rules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `formations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `opening_hours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `study_emission_factor_versions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `study_exports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `study_sites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_application_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_checked_steps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `users_on_study` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "actualities" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "contributors" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "deactivable_features_statuses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "documents" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factor_import_version" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "emission_factor_part_metadata" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "emission_factor_parts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factors" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_metadata" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "export_rules" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "formations" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "licenses" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "opening_hours" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sites" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "studies" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "study_emission_factor_versions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "study_emission_sources" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "study_exports" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "study_sites" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_application_settings" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_checked_steps" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users_on_study" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- Set default values and remove NOT NULL constraint for `updated_at` columns

ALTER TABLE "contributors" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "emission_factor_import_version" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "emission_factor_part_metadata" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "emission_metadata" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "export_rules" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "formations" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "opening_hours" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "study_emission_factor_versions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "study_exports" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "study_sites" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "user_application_settings" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "user_checked_steps" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;

ALTER TABLE "users_on_study" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" DROP NOT NULL;
