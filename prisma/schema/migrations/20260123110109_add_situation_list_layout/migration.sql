/*
  Warnings:

  - Added the required column `situation_list_layout` to the `situations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "situations" ADD COLUMN     "situation_list_layout" JSONB NOT NULL;
