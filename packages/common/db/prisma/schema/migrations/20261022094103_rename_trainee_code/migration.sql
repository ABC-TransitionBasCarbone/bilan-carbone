/*
  Warnings:

  - You are about to drop the column `trainee_code` on the `course_session` table. All the data in the column will be lost.
  - Added the required column `code` to the `course_session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bilan_carbone"."course_session" DROP COLUMN "trainee_code",
ADD COLUMN     "code" TEXT NOT NULL;
