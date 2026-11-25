BEGIN;

CREATE TYPE "bilan_carbone"."AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT');
ALTER TABLE "bilan_carbone"."attendance"
  ALTER COLUMN "status" TYPE "bilan_carbone"."AttendanceStatus_new"
  USING ("status"::text::"bilan_carbone"."AttendanceStatus_new");
ALTER TYPE "bilan_carbone"."AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "bilan_carbone"."AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "bilan_carbone"."AttendanceStatus_old";

COMMIT;
