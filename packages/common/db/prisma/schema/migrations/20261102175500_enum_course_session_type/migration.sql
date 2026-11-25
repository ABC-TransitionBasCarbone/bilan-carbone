CREATE TYPE "bilan_carbone"."CourseSessionType" AS ENUM ('INITIAL', 'PROFESSIONNEL', 'MAITRISE');

ALTER TABLE "bilan_carbone"."studies" RENAME COLUMN "course_type" TO "course_session_type";

ALTER TABLE "bilan_carbone"."studies"
ALTER COLUMN "course_session_type" TYPE "bilan_carbone"."CourseSessionType"
USING (
  CASE LOWER(TRIM("course_session_type"))
    WHEN 'm1' THEN 'INITIAL'
    WHEN 'm2' THEN 'PROFESSIONNEL'
    WHEN 'm3' THEN 'MAITRISE'
    ELSE LOWER(TRIM("course_session_type"))
  END
)::"bilan_carbone"."CourseSessionType";

ALTER TABLE "bilan_carbone"."course_session"
ALTER COLUMN "type" TYPE "bilan_carbone"."CourseSessionType"
USING (
  CASE LOWER(TRIM("type"))
    WHEN 'm1' THEN 'INITIAL'
    WHEN 'm2' THEN 'PROFESSIONNEL'
    WHEN 'm3' THEN 'MAITRISE'
    ELSE LOWER(TRIM("type"))
  END
)::"bilan_carbone"."CourseSessionType";
