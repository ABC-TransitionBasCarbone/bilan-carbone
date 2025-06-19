-- CreateEnum
CREATE TYPE "Type" AS ENUM ('QCM', 'QCU', 'SELECT', 'TABLE', 'date', 'number', 'range', 'tel', 'text');

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "idIntern" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" SERIAL NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "type" "Type" NOT NULL,
    "PossibleAnswers" JSONB,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
