-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCM', 'QCU', 'SELECT', 'SELECT_FE', 'TABLE', 'POSTAL_CODE', 'DATE', 'NUMBER', 'RANGE', 'PHONE', 'TEXT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Unit" ADD VALUE 'MOVIES';
ALTER TYPE "Unit" ADD VALUE 'PERSON';

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "id_intern" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "sub_post" "SubPost" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "unit" "Unit",
    "possible_answers" TEXT[],
    "required" BOOLEAN NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "studyId" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_id_intern_key" ON "questions"("id_intern");

-- CreateIndex
CREATE UNIQUE INDEX "answers_question_id_studyId_key" ON "answers"("question_id", "studyId");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
