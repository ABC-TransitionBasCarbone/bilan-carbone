-- AlterTable
ALTER TABLE "studies" 
ADD COLUMN     "realization_end_date" DATE,
ADD COLUMN     "realization_start_date" DATE;

UPDATE "studies"
SET "realization_start_date" = DATE("created_at");
