/*
  Warnings:
*/
-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_parentId_fkey";

-- AlterTable
ALTER TABLE "organizations" RENAME COLUMN "parentId" TO "parent_id";

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
