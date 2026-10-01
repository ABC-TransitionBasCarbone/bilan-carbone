/*
  Warnings:

  - The primary key for the `contributors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `userId` on the `contributors` table. All the data in the column will be lost.
  - You are about to drop the column `site_id` on the `study_emission_sources` table. All the data in the column will be lost.
  - You are about to drop the column `subPost` on the `study_emission_sources` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[study_id,site_id]` on the table `study_sites` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `contributors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `study_site_id` to the `study_emission_sources` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sub_post` to the `study_emission_sources` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_userId_fkey";

-- DropForeignKey
ALTER TABLE "study_emission_sources" DROP CONSTRAINT "study_emission_sources_site_id_fkey";

-- AlterTable
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_pkey",
DROP COLUMN "userId",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "contributors_pkey" PRIMARY KEY ("study_id", "user_id", "subPost");

-- AlterTable
ALTER TABLE "study_emission_sources" DROP COLUMN "site_id",
DROP COLUMN "subPost",
ADD COLUMN     "study_site_id" TEXT NOT NULL,
ADD COLUMN     "sub_post" "SubPost" NOT NULL;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_study_site_id_fkey" FOREIGN KEY ("study_site_id") REFERENCES "study_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
