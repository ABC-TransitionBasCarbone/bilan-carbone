/*
  Warnings:

  - The primary key for the `contributors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `contributors` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_application_settings` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `user_checked_steps` table. All the data in the column will be lost.
  - You are about to drop the column `imported_file_date` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `organization_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - The primary key for the `users_on_study` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `users_on_study` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[account_id]` on the table `user_application_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[account_id,step]` on the table `user_checked_steps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `account_id` to the `contributors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `user_application_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `user_checked_steps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `users_on_study` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('BC', 'CUT', 'TILT');

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_uploader_id_fkey";

-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_onboarder_id_fkey";

-- DropForeignKey
ALTER TABLE "studies" DROP CONSTRAINT "studies_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "study_emission_sources" DROP CONSTRAINT "study_emission_sources_contributor_id_fkey";

-- DropForeignKey
ALTER TABLE "user_application_settings" DROP CONSTRAINT "user_application_settings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_user_id_fkey";

-- DropIndex
DROP INDEX "user_application_settings_user_id_key";

-- DropIndex
DROP INDEX "user_checked_steps_user_id_step_key";

-- AlterTable
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD CONSTRAINT "contributors_pkey" PRIMARY KEY ("study_id", "account_id", "subPost");

-- AlterTable
ALTER TABLE "user_application_settings" DROP COLUMN "user_id",
ADD COLUMN     "account_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_checked_steps" DROP COLUMN "user_id",
ADD COLUMN     "account_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "imported_file_date",
DROP COLUMN "organization_id",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD CONSTRAINT "users_on_study_pkey" PRIMARY KEY ("study_id", "account_id");

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,
    "imported_file_date" TIMESTAMP(3),
    "organization_id" TEXT,
    "role" "Role" NOT NULL,
    "environment" "Environment" NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_user_id_environment_key" ON "accounts"("user_id", "environment");

-- CreateIndex
CREATE UNIQUE INDEX "user_application_settings_account_id_key" ON "user_application_settings"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_checked_steps_account_id_step_key" ON "user_checked_steps"("account_id", "step");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_onboarder_id_fkey" FOREIGN KEY ("onboarder_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_study" ADD CONSTRAINT "users_on_study_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_application_settings" ADD CONSTRAINT "user_application_settings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
