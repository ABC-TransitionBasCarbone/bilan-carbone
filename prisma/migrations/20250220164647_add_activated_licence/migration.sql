/*
  Warnings:

  - Added the required column `activated_licence` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "activated_licence" BOOLEAN NOT NULL;
