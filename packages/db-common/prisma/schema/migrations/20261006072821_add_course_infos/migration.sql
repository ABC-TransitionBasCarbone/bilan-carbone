-- CreateTable
CREATE TABLE "bilan_carbone"."session_code" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trainee_code" TEXT NOT NULL,
    "professor_code" TEXT,

    CONSTRAINT "session_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bilan_carbone"."course_session" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "organization_version_id" TEXT,
    "course_organism_id" TEXT,
    "session_code_id" TEXT,

    CONSTRAINT "course_session_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_organization_version_id_fkey" FOREIGN KEY ("organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_course_organism_id_fkey" FOREIGN KEY ("course_organism_id") REFERENCES "bilan_carbone"."course_organism"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_session_code_id_fkey" FOREIGN KEY ("session_code_id") REFERENCES "bilan_carbone"."session_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;
