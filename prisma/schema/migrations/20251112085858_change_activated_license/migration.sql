/*
  Warnings:

  - The `activated_licence` column on the `organization_versions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "organization_versions" DROP COLUMN "activated_licence",
ADD COLUMN     "activated_licence" INTEGER[] DEFAULT ARRAY[2025]::INTEGER[];
