/*
  Warnings:

  - The primary key for the `users_on_study` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `users_on_study` table. All the data in the column will be lost.
  - You are about to drop the `StudySite` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `users_on_study` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudySite" DROP CONSTRAINT "StudySite_site_id_fkey";

-- DropForeignKey
ALTER TABLE "StudySite" DROP CONSTRAINT "StudySite_study_id_fkey";

-- DropForeignKey
ALTER TABLE "study_emission_sources" DROP CONSTRAINT "study_emission_sources_site_id_fkey";

-- DropForeignKey
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_userId_fkey";

-- AlterTable
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_pkey",
DROP COLUMN "userId",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "users_on_study_pkey" PRIMARY KEY ("study_id", "user_id");

-- DropTable
DROP TABLE "StudySite";

-- CreateTable
CREATE TABLE "study_sites" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "etp" INTEGER NOT NULL,
    "ca" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "study_sites_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users_on_study" ADD CONSTRAINT "users_on_study_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "study_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sites" ADD CONSTRAINT "study_sites_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sites" ADD CONSTRAINT "study_sites_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
