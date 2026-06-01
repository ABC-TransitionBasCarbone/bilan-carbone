-- AlterTable
ALTER TABLE "bilan_carbone"."situations" ADD COLUMN "answered_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "bilan_carbone"."situations" ADD COLUMN "total_count" INTEGER NOT NULL DEFAULT 0;
