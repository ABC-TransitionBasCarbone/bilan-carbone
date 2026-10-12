/*
  Warnings:

  - You are about to drop the `_CourseSessionTraineeList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bilan_carbone"."_CourseSessionTraineeList" DROP CONSTRAINT "_CourseSessionTraineeList_A_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."_CourseSessionTraineeList" DROP CONSTRAINT "_CourseSessionTraineeList_B_fkey";

-- DropTable
DROP TABLE "bilan_carbone"."_CourseSessionTraineeList";

-- CreateTable
CREATE TABLE "bilan_carbone"."course_session_trainee" (
    "course_session_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,

    CONSTRAINT "course_session_trainee_pkey" PRIMARY KEY ("course_session_id","account_id")
);

-- CreateIndex
CREATE INDEX "course_session_trainee_account_id_idx" ON "bilan_carbone"."course_session_trainee"("account_id");

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session_trainee" ADD CONSTRAINT "course_session_trainee_course_session_id_fkey" FOREIGN KEY ("course_session_id") REFERENCES "bilan_carbone"."course_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bilan_carbone"."course_session_trainee" ADD CONSTRAINT "course_session_trainee_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "bilan_carbone"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
