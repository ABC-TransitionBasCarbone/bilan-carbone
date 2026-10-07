/*
  Warnings:

  - You are about to drop the column `studyId` on the `answers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[question_id,studySiteId]` on the table `answers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studySiteId` to the `answers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_studyId_fkey";

-- DropIndex
DROP INDEX "answers_question_id_studyId_key";

-- AlterTable
ALTER TABLE "answers" DROP COLUMN "studyId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "emission_source_id" TEXT,
ADD COLUMN     "studySiteId" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "answers_question_id_studySiteId_key" ON "answers"("question_id", "studySiteId");

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_studySiteId_fkey" FOREIGN KEY ("studySiteId") REFERENCES "study_sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_emission_source_id_fkey" FOREIGN KEY ("emission_source_id") REFERENCES "study_emission_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
