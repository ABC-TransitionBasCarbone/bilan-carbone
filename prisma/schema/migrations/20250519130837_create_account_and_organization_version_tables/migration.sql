/*
  Warnings:

  - A unique constraint covering the columns `[account_id]` on the table `user_application_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('BC', 'CUT', 'TILT');

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploader_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "user_application_settings" DROP CONSTRAINT "user_application_settings_user_id_fkey";

-- AlterTable
ALTER TABLE "contributors" ADD COLUMN     "account_id" TEXT;

-- AlterTable
ALTER TABLE "deactivable_features_statuses" ADD COLUMN     "updated_by_account" TEXT;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "uploader_account_id" TEXT,
ALTER COLUMN "uploader_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "wordpress_id" TEXT,
ALTER COLUMN "is_cr" DROP NOT NULL,
ALTER COLUMN "is_cr" SET DEFAULT false,
ALTER COLUMN "onboarded" DROP NOT NULL,
ALTER COLUMN "activated_licence" DROP NOT NULL,
ALTER COLUMN "activated_licence" SET DEFAULT false;

-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "created_by_account_id" TEXT,
ADD COLUMN     "organizationVersion_id" TEXT,
ALTER COLUMN "organization_id" DROP NOT NULL,
ALTER COLUMN "created_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "study_emission_sources" ADD COLUMN     "contributor_account_id" TEXT;

-- AlterTable
ALTER TABLE "user_application_settings" ADD COLUMN     "account_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_checked_steps" ADD COLUMN     "account_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users_on_study" ADD COLUMN     "account_id" TEXT;

-- CreateTable
CREATE TABLE "organization_versions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "is_cr" BOOLEAN NOT NULL DEFAULT false,
    "activated_licence" BOOLEAN NOT NULL DEFAULT false,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "onboarder_id" TEXT,
    "parent_id" TEXT,
    "environment" "Environment" NOT NULL,

    CONSTRAINT "organization_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "imported_file_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "organizationVersion_id" TEXT,
    "role" "Role" NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_versions_organizationId_environment_key" ON "organization_versions"("organizationId", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_organizationVersion_id_key" ON "accounts"("user_id", "organizationVersion_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_application_settings_account_id_key" ON "user_application_settings"("account_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_account_id_fkey" FOREIGN KEY ("uploader_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deactivable_features_statuses" ADD CONSTRAINT "deactivable_features_statuses_updated_by_account_fkey" FOREIGN KEY ("updated_by_account") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_versions" ADD CONSTRAINT "organization_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_versions" ADD CONSTRAINT "organization_versions_onboarder_id_fkey" FOREIGN KEY ("onboarder_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_versions" ADD CONSTRAINT "organization_versions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_organizationVersion_id_fkey" FOREIGN KEY ("organizationVersion_id") REFERENCES "organization_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_study" ADD CONSTRAINT "users_on_study_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_contributor_account_id_fkey" FOREIGN KEY ("contributor_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organizationVersion_id_fkey" FOREIGN KEY ("organizationVersion_id") REFERENCES "organization_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_application_settings" ADD CONSTRAINT "user_application_settings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_application_settings" ADD CONSTRAINT "user_application_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
