/*
  Warnings:

  - You are about to drop the column `environment` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `activated_licence` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `is_cr` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `onboarded` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `onboarder_id` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `siret` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `studies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,organizationVersion_id]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationVersion_id` to the `studies` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_onboarder_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_organization_id_fkey";

-- DropIndex
DROP INDEX "accounts_user_id_environment_key";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "environment",
DROP COLUMN "organization_id",
ADD COLUMN     "organizationVersion_id" TEXT;

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "activated_licence",
DROP COLUMN "is_cr",
DROP COLUMN "onboarded",
DROP COLUMN "onboarder_id",
DROP COLUMN "siret",
ADD COLUMN     "wordpress_id" TEXT;

-- AlterTable
ALTER TABLE "studies" DROP COLUMN "organization_id",
ADD COLUMN     "organizationVersion_id" TEXT NOT NULL;

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
    "environment" "Environment" NOT NULL,

    CONSTRAINT "organization_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_versions_organizationId_environment_key" ON "organization_versions"("organizationId", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_organizationVersion_id_key" ON "accounts"("user_id", "organizationVersion_id");

-- AddForeignKey
ALTER TABLE "organization_versions" ADD CONSTRAINT "organization_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_versions" ADD CONSTRAINT "organization_versions_onboarder_id_fkey" FOREIGN KEY ("onboarder_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_organizationVersion_id_fkey" FOREIGN KEY ("organizationVersion_id") REFERENCES "organization_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organizationVersion_id_fkey" FOREIGN KEY ("organizationVersion_id") REFERENCES "organization_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;


/* Ajouts manuels */

ALTER TABLE organizations
ADD CONSTRAINT wordpress_or_parent_not_null
CHECK (wordpress_id IS NOT NULL OR parent_id IS NOT NULL);

-- ALTER TABLE organization_versions
-- ADD CONSTRAINT org_versions_only_for_parent_orgs
-- CHECK ((SELECT parent_id FROM organizations WHERE organizations.id = organization_versions.organization_id) IS NULL);