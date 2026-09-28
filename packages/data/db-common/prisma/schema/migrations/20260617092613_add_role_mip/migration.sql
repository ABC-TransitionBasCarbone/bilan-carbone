/*
  Warnings:

  - Added the required column `role` to the `accounts_mip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "mip"."RoleMip" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'COLLABORATOR');

-- AlterTable
ALTER TABLE "mip"."accounts_mip" ADD COLUMN     "role" "mip"."RoleMip" NOT NULL;
