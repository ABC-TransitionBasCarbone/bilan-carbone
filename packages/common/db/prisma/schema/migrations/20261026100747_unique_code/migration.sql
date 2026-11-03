/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `course_session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "course_session_code_key" ON "bilan_carbone"."course_session"("code");
