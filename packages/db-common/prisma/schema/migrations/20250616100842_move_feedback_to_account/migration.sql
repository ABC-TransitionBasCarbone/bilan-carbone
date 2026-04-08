/*
  Warnings:

  - You are about to drop the column `feedback_date` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "feedback_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "feedback_date";
