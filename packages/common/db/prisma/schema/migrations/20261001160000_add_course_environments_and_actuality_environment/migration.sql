ALTER TYPE "common"."Environment" ADD VALUE IF NOT EXISTS 'COURSE_BC';
ALTER TYPE "common"."Environment" ADD VALUE IF NOT EXISTS 'COURSE_TILT';

ALTER TABLE "bilan_carbone"."actualities" ADD COLUMN IF NOT EXISTS "environment" "common"."Environment" NOT NULL DEFAULT 'BC';
