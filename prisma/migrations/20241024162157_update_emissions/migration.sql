/*
  Warnings:

  - You are about to drop the column `post` on the `emission_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `emission_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `post` on the `emissions` table. All the data in the column will be lost.
  - You are about to drop the column `quality` on the `emissions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `emissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imported_id]` on the table `emissions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "emission_metadata" DROP COLUMN "post",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "emissions" DROP COLUMN "post",
DROP COLUMN "quality",
DROP COLUMN "type",
ADD COLUMN     "unit" "Unit";

-- DropEnum
DROP TYPE "EmissionType";

-- CreateTable
CREATE TABLE "emission_posts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emission_id" TEXT NOT NULL,
    "total_co2" DOUBLE PRECISION NOT NULL,
    "co2f" DOUBLE PRECISION,
    "ch4f" DOUBLE PRECISION,
    "ch4b" DOUBLE PRECISION,
    "n2o" DOUBLE PRECISION,
    "co2b" DOUBLE PRECISION,
    "other_ges" DOUBLE PRECISION,

    CONSTRAINT "emission_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_post_metadata" (
    "emission_post_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "attribute" TEXT,
    "frontiere" TEXT,
    "tag" TEXT,
    "location" TEXT,
    "comment" TEXT,

    CONSTRAINT "emission_post_metadata_pkey" PRIMARY KEY ("emission_post_id","language")
);

-- CreateIndex
CREATE UNIQUE INDEX "emissions_imported_id_key" ON "emissions"("imported_id");

-- AddForeignKey
ALTER TABLE "emission_posts" ADD CONSTRAINT "emission_posts_emission_id_fkey" FOREIGN KEY ("emission_id") REFERENCES "emissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_post_metadata" ADD CONSTRAINT "emission_post_metadata_emission_post_id_fkey" FOREIGN KEY ("emission_post_id") REFERENCES "emission_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
