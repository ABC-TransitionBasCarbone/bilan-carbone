UPDATE "study_exports" SET "control" = 'Operational' WHERE "control" IS NULL;

ALTER TABLE "study_exports" 
ALTER COLUMN "control" SET NOT NULL,
ALTER COLUMN "control" SET DEFAULT 'Operational';
