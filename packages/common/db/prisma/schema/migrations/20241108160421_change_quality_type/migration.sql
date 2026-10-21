/*
  Warnings:

  - You are about to alter the column `technical_representativeness` on the `emissions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `geographic_representativeness` on the `emissions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `temporal_representativeness` on the `emissions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `completeness` on the `emissions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "emissions" ALTER COLUMN "technical_representativeness" SET DATA TYPE INTEGER,
ALTER COLUMN "geographic_representativeness" SET DATA TYPE INTEGER,
ALTER COLUMN "temporal_representativeness" SET DATA TYPE INTEGER,
ALTER COLUMN "completeness" SET DATA TYPE INTEGER;
