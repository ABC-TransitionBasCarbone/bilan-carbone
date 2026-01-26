/*
  Warnings:

  - Added the required column `list_layout_situations` to the `situations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "situations" ADD COLUMN     "list_layout_situations" JSONB NOT NULL;
