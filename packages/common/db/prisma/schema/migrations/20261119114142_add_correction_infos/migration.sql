-- CreateTable
CREATE TABLE "bilan_carbone"."study_correction_deliveries" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_study_id" TEXT NOT NULL,
    "course_session_id" TEXT NOT NULL,
    "recipient_organization_version_id" TEXT NOT NULL,
    "copied_study_id" TEXT NOT NULL,
    "transition_plan_sent_at" TIMESTAMP(3),

    CONSTRAINT "study_correction_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_correction_deliveries_copied_study_id_key" ON "bilan_carbone"."study_correction_deliveries"("copied_study_id");

-- CreateIndex
CREATE INDEX "study_correction_deliveries_course_session_id_idx" ON "bilan_carbone"."study_correction_deliveries"("course_session_id");

-- CreateIndex
CREATE INDEX "study_correction_deliveries_recipient_organization_idx" ON "bilan_carbone"."study_correction_deliveries"("recipient_organization_version_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_correction_deliveries_source_session_recipient_key" ON "bilan_carbone"."study_correction_deliveries"("source_study_id", "course_session_id", "recipient_organization_version_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD CONSTRAINT "study_correction_deliveries_source_study_id_fkey" FOREIGN KEY ("source_study_id") REFERENCES "bilan_carbone"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD CONSTRAINT "study_correction_deliveries_course_session_id_fkey" FOREIGN KEY ("course_session_id") REFERENCES "bilan_carbone"."course_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD CONSTRAINT "study_correction_deliveries_recipient_organization_fkey" FOREIGN KEY ("recipient_organization_version_id") REFERENCES "bilan_carbone"."organization_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."study_correction_deliveries" ADD CONSTRAINT "study_correction_deliveries_copied_study_id_fkey" FOREIGN KEY ("copied_study_id") REFERENCES "bilan_carbone"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
