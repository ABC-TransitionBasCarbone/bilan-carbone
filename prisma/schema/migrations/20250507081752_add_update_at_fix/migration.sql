/*
  Warnings:

  - Made the column `updated_at` on table `contributors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `emission_factor_import_version` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `emission_factor_part_metadata` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `emission_metadata` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `export_rules` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `formations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `opening_hours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `study_emission_factor_versions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `study_exports` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `study_sites` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `user_application_settings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `user_checked_steps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updated_at` on table `users_on_study` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "contributors" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factor_import_version" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_factor_part_metadata" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "emission_metadata" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "export_rules" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "formations" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "opening_hours" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "study_emission_factor_versions" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "study_exports" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "study_sites" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_application_settings" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_checked_steps" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users_on_study" ALTER COLUMN "updated_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT;
