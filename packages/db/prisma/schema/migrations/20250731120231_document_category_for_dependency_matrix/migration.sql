-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('DependencyMatrix');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "document_category" "DocumentCategory";
