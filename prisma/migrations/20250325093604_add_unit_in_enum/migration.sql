-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Unit" ADD VALUE 'KEURO_2019_HT';
ALTER TYPE "Unit" ADD VALUE 'KEURO_2020_HT';
ALTER TYPE "Unit" ADD VALUE 'KEURO_2021_HT';
ALTER TYPE "Unit" ADD VALUE 'KEURO_2022_HT';
ALTER TYPE "Unit" ADD VALUE 'KEURO_2023_HT';
