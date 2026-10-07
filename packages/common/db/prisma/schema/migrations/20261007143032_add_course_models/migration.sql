-- CreateTable
CREATE TABLE "bilan_carbone"."course_organism" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "ftp_path" TEXT NOT NULL,

    CONSTRAINT "course_organism_pkey" PRIMARY KEY ("id")
);

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
    "organization_version_id" TEXT NOT NULL,
    "course_organism_id" TEXT NOT NULL,
    "session_code_id" TEXT,

    CONSTRAINT "course_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_organism_name_key" ON "bilan_carbone"."course_organism"("name");

-- CreateIndex
CREATE UNIQUE INDEX "session_code_trainee_code_key" ON "bilan_carbone"."session_code"("trainee_code");

-- CreateIndex
CREATE UNIQUE INDEX "session_code_professor_code_key" ON "bilan_carbone"."session_code"("professor_code");

-- CreateIndex
CREATE UNIQUE INDEX "course_session_organization_version_id_key" ON "bilan_carbone"."course_session"("organization_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_session_session_code_id_key" ON "bilan_carbone"."course_session"("session_code_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_organization_version_id_fkey" FOREIGN KEY ("organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_course_organism_id_fkey" FOREIGN KEY ("course_organism_id") REFERENCES "bilan_carbone"."course_organism"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_session_code_id_fkey" FOREIGN KEY ("session_code_id") REFERENCES "bilan_carbone"."session_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;
