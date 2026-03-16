/*
  Warnings:

  - The primary key for the `contributors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `contributors` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `deactivable_features_statuses` table. All the data in the column will be lost.
  - You are about to drop the column `uploader_id` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `activated_licence` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `is_cr` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `onboarded` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `onboarder_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `parent_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `siret` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_id` on the `studies` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `studies` table. All the data in the column will be lost.
  - You are about to drop the column `contributor_id` on the `study_emission_sources` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_application_settings` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_checked_steps` table. All the data in the column will be lost.
  - You are about to drop the column `imported_file_date` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - The primary key for the `users_on_study` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `users_on_study` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account_id,step]` on the table `user_checked_steps` will be added. If there are existing duplicate values, this will fail.
  - Made the column `account_id` on table `contributors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `uploader_account_id` on table `documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_by_account_id` on table `studies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organizationVersion_id` on table `studies` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_id` on table `user_checked_steps` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_id` on table `users_on_study` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_account_id_fkey";

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "deactivable_features_statuses" DROP CONSTRAINT "deactivable_features_statuses_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploader_account_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploader_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_onboarder_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_created_by_account_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_organizationVersion_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "study_emission_sources" DROP CONSTRAINT "study_emission_sources_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "user_application_settings" DROP CONSTRAINT "user_application_settings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_account_id_fkey";

-- DropForeignKey
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_user_id_fkey";

-- DropIndex
DROP INDEX "user_application_settings_user_id_key";

-- DropIndex
DROP INDEX "user_checked_steps_user_id_step_key";

-- AlterTable
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_pkey",
DROP COLUMN "user_id",
ALTER COLUMN "account_id" SET NOT NULL,
ADD CONSTRAINT "contributors_pkey" PRIMARY KEY ("study_id", "account_id", "subPost");

-- AlterTable
ALTER TABLE "deactivable_features_statuses" DROP COLUMN "updated_by";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "uploader_id",
ALTER COLUMN "uploader_account_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "activated_licence",
DROP COLUMN "is_cr",
DROP COLUMN "onboarded",
DROP COLUMN "onboarder_id",
DROP COLUMN "parent_id",
DROP COLUMN "siret";

-- AlterTable
ALTER TABLE "studies" DROP COLUMN "created_by_id",
DROP COLUMN "organization_id",
ALTER COLUMN "created_by_account_id" SET NOT NULL,
ALTER COLUMN "organizationVersion_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "study_emission_sources" DROP COLUMN "contributor_id";

-- AlterTable
ALTER TABLE "user_application_settings" DROP COLUMN "user_id";