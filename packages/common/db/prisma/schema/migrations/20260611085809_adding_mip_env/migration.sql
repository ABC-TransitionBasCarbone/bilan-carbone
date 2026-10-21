/*
  Warnings:

  - A unique constraint covering the columns `[user_id,environment]` on the table `accounts_mip` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organization_id,environment]` on the table `organization_versions_mip` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "common"."Environment" ADD VALUE 'MIP';

-- AlterTable
ALTER TABLE "mip"."accounts_mip" ADD COLUMN     "environment" "common"."Environment" NOT NULL DEFAULT 'MIP';

-- AlterTable
ALTER TABLE "mip"."organization_versions_mip" ADD COLUMN     "environment" "common"."Environment" NOT NULL DEFAULT 'MIP';

-- CreateIndex
CREATE UNIQUE INDEX "accounts_mip_user_id_environment_key" ON "mip"."accounts_mip"("user_id", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "organization_versions_mip_organization_id_environment_key" ON "mip"."organization_versions_mip"("organization_id", "environment");
