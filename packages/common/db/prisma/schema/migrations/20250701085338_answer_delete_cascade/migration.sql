-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_studySiteId_fkey";

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_studySiteId_fkey" FOREIGN KEY ("studySiteId") REFERENCES "study_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
