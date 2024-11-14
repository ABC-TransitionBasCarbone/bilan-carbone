-- AlterTable
ALTER TABLE "emissions" ALTER COLUMN "reliability" DROP NOT NULL;

-- CreateTable
CREATE TABLE "contributors" (
    "study_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subPost" "SubPost" NOT NULL,

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("study_id","userId","subPost")
);

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
