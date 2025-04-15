/*
  Warnings:

  - Added the required column `is_public` to the `studies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `studies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "studies" ADD COLUMN     "is_public" BOOLEAN NOT NULL,
ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
