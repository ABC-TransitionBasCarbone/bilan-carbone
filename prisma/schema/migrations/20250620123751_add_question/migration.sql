-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCM', 'QCU', 'SELECT', 'TABLE', 'POSTAL_CODE', 'DATE', 'NUMBER', 'RANGE', 'PHONE', 'TEXT');

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "id_intern" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "sub_post" "SubPost" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "unite" TEXT NOT NULL,
    "possible_answers" TEXT[],
    "required" BOOLEAN NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "studyId" TEXT NOT NULL,
    "question_ref" TEXT NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_id_intern_key" ON "questions"("id_intern");

-- CreateIndex
CREATE UNIQUE INDEX "answers_question_ref_studyId_key" ON "answers"("question_ref", "studyId");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_ref_fkey" FOREIGN KEY ("question_ref") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
