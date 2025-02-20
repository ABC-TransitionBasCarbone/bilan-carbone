/*
  Warnings:

  - Added the required column `actived_licence` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "actived_licence" BOOLEAN NOT NULL;
