/*
  Warnings:

  - You are about to drop the column `follow_up_description` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `follow_up_goal` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `implementation_description` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `implementation_goal` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `performance_description` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `performance_goal` on the `actions` table. All the data in the column will be lost.
  - You are about to drop the column `sub_steps` on the `actions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "actions" DROP COLUMN "follow_up_description",
DROP COLUMN "follow_up_goal",
DROP COLUMN "implementation_description",
DROP COLUMN "implementation_goal",
DROP COLUMN "performance_description",
DROP COLUMN "performance_goal",
DROP COLUMN "sub_steps";
