ALTER TYPE "common"."Environment" ADD VALUE 'COURSE_BC';
ALTER TYPE "common"."Environment" ADD VALUE 'COURSE_TILT';

ALTER TABLE "bilan_carbone"."actualities" ADD COLUMN "environment" "common"."Environment" NOT NULL DEFAULT 'BC';
