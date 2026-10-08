-- CreateTable
CREATE TABLE "bilan_carbone"."course_session" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "trainee_code" TEXT NOT NULL,
    "professor_code" TEXT,
    "course_organism_id" TEXT NOT NULL,
    "professor_id" TEXT NOT NULL,

    CONSTRAINT "course_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bilan_carbone"."_CourseSessionTraineeList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseSessionTraineeList_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseSessionTraineeList_B_index" ON "bilan_carbone"."_CourseSessionTraineeList"("B");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_course_organism_id_fkey" FOREIGN KEY ("course_organism_id") REFERENCES "bilan_carbone"."course_organism"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session" ADD CONSTRAINT "course_session_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "bilan_carbone"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."_CourseSessionTraineeList" ADD CONSTRAINT "_CourseSessionTraineeList_A_fkey" FOREIGN KEY ("A") REFERENCES "bilan_carbone"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."_CourseSessionTraineeList" ADD CONSTRAINT "_CourseSessionTraineeList_B_fkey" FOREIGN KEY ("B") REFERENCES "bilan_carbone"."course_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
