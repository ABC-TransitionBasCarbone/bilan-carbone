-- CreateEnum
CREATE TYPE "Type" AS ENUM ('QCM', 'QCU', 'SELECT', 'TABLE', 'date', 'number', 'range', 'tel', 'text');

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "idIntern" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "type" "Type" NOT NULL,
    "PossibleAnswers" JSONB NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);
