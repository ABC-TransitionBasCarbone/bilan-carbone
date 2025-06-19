-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('QCM', 'QCU', 'SELECT', 'TABLE', 'POSTALCODE', 'date', 'number', 'range', 'tel', 'text');

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "idIntern" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "possibleAnswers" TEXT[],

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "response" JSONB NOT NULL,
    "studyId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
