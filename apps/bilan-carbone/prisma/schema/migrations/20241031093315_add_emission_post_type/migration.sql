/*
  Warnings:

  - Made the column `title` on table `emission_post_metadata` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `type` to the `emission_posts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('UPSTREAM', 'DEPRECIATION', 'OTHER', 'FUEL_UPSTREAM_COMBUSTION', 'COLLECTION', 'COMBUSTION', 'COMBUSTION_PLANT', 'FUGITIVE_EMISSIONS', 'ENERGY', 'MANUFACTURING', 'LEAKS', 'INCINERATION', 'INPUTS', 'PROCESSING', 'TRANSPORT', 'TRANSPORT_DISTRIBUTION');

-- AlterTable
ALTER TABLE "emission_post_metadata" ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "emission_posts" ADD COLUMN     "type" "PostType" NOT NULL;
