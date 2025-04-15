/*
  Warnings:

  - You are about to drop the column `organisation_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `organisations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organization_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CR';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organisation_id_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "organisation_id",
ADD COLUMN     "organization_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "organisations";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cr_organizations" (
    "userId" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,

    CONSTRAINT "cr_organizations_pkey" PRIMARY KEY ("userId","organization_id")
);

-- AddForeignKey
ALTER TABLE "cr_organizations" ADD CONSTRAINT "cr_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cr_organizations" ADD CONSTRAINT "cr_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
