/*
  Warnings:

  - You are about to drop the column `is_active` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_validated` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('IMPORTED', 'PENDING_REQUEST', 'VALIDATED', 'ACTIVE');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "is_active",
DROP COLUMN "is_validated",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
