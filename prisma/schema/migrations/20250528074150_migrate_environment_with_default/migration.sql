/*
  Warnings:

  - A unique constraint covering the columns `[user_id,environment]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "accounts_user_id_organizationVersion_id_key";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "environment" "Environment" NOT NULL DEFAULT 'BC';

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_environment_key" ON "accounts"("user_id", "environment");
