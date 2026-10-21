/*
  Warnings:

  - The primary key for the `emission_metadata` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `emission_id` on the `emission_metadata` table. All the data in the column will be lost.
  - You are about to drop the column `emission_id` on the `study_emission_sources` table. All the data in the column will be lost.
  - You are about to drop the `emission_post_metadata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `emission_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `emissions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `emission_factor_id` to the `emission_metadata` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmissionFactorStatus" AS ENUM ('Archived', 'Valid');

-- DropForeignKey
ALTER TABLE "emission_metadata" DROP CONSTRAINT "emission_metadata_emission_id_fkey";

-- DropForeignKey
ALTER TABLE "emission_post_metadata" DROP CONSTRAINT "emission_post_metadata_emission_post_id_fkey";

-- DropForeignKey
ALTER TABLE "emission_posts" DROP CONSTRAINT "emission_posts_emission_id_fkey";

-- DropForeignKey
ALTER TABLE "emissions" DROP CONSTRAINT "emissions_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "study_emission_sources" DROP CONSTRAINT "study_emission_sources_emission_id_fkey";

-- AlterTable
ALTER TABLE "emission_metadata" DROP CONSTRAINT "emission_metadata_pkey",
DROP COLUMN "emission_id",
ADD COLUMN     "emission_factor_id" TEXT NOT NULL,
ADD CONSTRAINT "emission_metadata_pkey" PRIMARY KEY ("emission_factor_id", "language");

-- AlterTable
ALTER TABLE "study_emission_sources" DROP COLUMN "emission_id",
ADD COLUMN     "emission_factor_id" TEXT;

-- DropTable
DROP TABLE "emission_post_metadata";

-- DropTable
DROP TABLE "emission_posts";

-- DropTable
DROP TABLE "emissions";

-- DropEnum
DROP TYPE "EmissionStatus";

-- CreateTable
CREATE TABLE "emission_factors" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imported_from" "Import" NOT NULL,
    "imported_id" TEXT,
    "organization_id" TEXT,
    "status" "EmissionFactorStatus" NOT NULL,
    "source" TEXT,
    "location" TEXT,
    "incertitude" INTEGER,
    "reliability" INTEGER,
    "technical_representativeness" INTEGER,
    "geographic_representativeness" INTEGER,
    "temporal_representativeness" INTEGER,
    "completeness" INTEGER,
    "total_co2" DOUBLE PRECISION NOT NULL,
    "co2f" DOUBLE PRECISION,
    "ch4f" DOUBLE PRECISION,
    "ch4b" DOUBLE PRECISION,
    "n2o" DOUBLE PRECISION,
    "co2b" DOUBLE PRECISION,
    "sf6" DOUBLE PRECISION,
    "hfc" DOUBLE PRECISION,
    "pfc" DOUBLE PRECISION,
    "other_ges" DOUBLE PRECISION,
    "unit" "Unit",
    "sub_posts" "SubPost"[],

    CONSTRAINT "emission_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factor_parts" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emission_factor_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "total_co2" DOUBLE PRECISION NOT NULL,
    "co2f" DOUBLE PRECISION,
    "ch4f" DOUBLE PRECISION,
    "ch4b" DOUBLE PRECISION,
    "n2o" DOUBLE PRECISION,
    "co2b" DOUBLE PRECISION,
    "sf6" DOUBLE PRECISION,
    "hfc" DOUBLE PRECISION,
    "pfc" DOUBLE PRECISION,
    "other_ges" DOUBLE PRECISION,

    CONSTRAINT "emission_factor_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emission_factor_part_metadata" (
    "emission_post_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,

    CONSTRAINT "emission_factor_part_metadata_pkey" PRIMARY KEY ("emission_post_id","language")
);

-- CreateIndex
CREATE INDEX "emission_factors_organization_id_idx" ON "emission_factors"("organization_id");

-- CreateIndex
CREATE INDEX "emission_factors_status_idx" ON "emission_factors"("status");

-- AddForeignKey
ALTER TABLE "emission_factors" ADD CONSTRAINT "emission_factors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_metadata" ADD CONSTRAINT "emission_metadata_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factor_parts" ADD CONSTRAINT "emission_factor_parts_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "emission_factors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emission_factor_part_metadata" ADD CONSTRAINT "emission_factor_part_metadata_emission_post_id_fkey" FOREIGN KEY ("emission_post_id") REFERENCES "emission_factor_parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_emission_factor_id_fkey" FOREIGN KEY ("emission_factor_id") REFERENCES "emission_factors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
