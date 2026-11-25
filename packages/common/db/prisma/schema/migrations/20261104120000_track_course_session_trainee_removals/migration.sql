CREATE TABLE "bilan_carbone"."course_session_trainee_removal" (
    "course_session_id" TEXT NOT NULL,
    "organization_version_id" TEXT NOT NULL,
    "removed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_session_trainee_removal_pkey" PRIMARY KEY ("course_session_id", "organization_version_id")
);

CREATE INDEX "course_session_trainee_removal_organization_version_id_idx" ON "bilan_carbone"."course_session_trainee_removal"("organization_version_id");

ALTER TABLE "bilan_carbone"."course_session_trainee_removal" ADD CONSTRAINT "course_session_trainee_removal_course_session_id_fkey" FOREIGN KEY ("course_session_id") REFERENCES "bilan_carbone"."course_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bilan_carbone"."course_session_trainee_removal" ADD CONSTRAINT "course_session_trainee_removal_organization_version_id_fkey" FOREIGN KEY ("organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;