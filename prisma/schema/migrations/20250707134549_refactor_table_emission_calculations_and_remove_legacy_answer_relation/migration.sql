/*
  Warnings:

  - You are about to drop the column `emission_source_id` on the `answers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "answers" DROP CONSTRAINT "answers_emission_source_id_fkey";

-- AlterTable
ALTER TABLE "answers" DROP COLUMN "emission_source_id";

-- CreateTable
CREATE TABLE "answer_emission_sources" (
    "id" TEXT NOT NULL,
    "answer_id" TEXT NOT NULL,
    "emission_source_id" TEXT NOT NULL,
    "row_id" TEXT,
    "row_index" INTEGER,
    "emission_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_emission_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "answer_emission_sources_answer_id_row_id_emission_type_key" ON "answer_emission_sources"("answer_id", "row_id", "emission_type");

-- AddForeignKey
ALTER TABLE "answer_emission_sources" ADD CONSTRAINT "answer_emission_sources_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_emission_sources" ADD CONSTRAINT "answer_emission_sources_emission_source_id_fkey" FOREIGN KEY ("emission_source_id") REFERENCES "study_emission_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
