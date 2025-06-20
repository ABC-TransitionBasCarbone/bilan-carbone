-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCM', 'QCU', 'SELECT', 'TABLE', 'POSTAL_CODE', 'DATE', 'NUMBER', 'RANGE', 'PHONE', 'TEXT');

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "idIntern" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "unite" TEXT NOT NULL,
    "possibleAnswers" TEXT[],

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "studyId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
