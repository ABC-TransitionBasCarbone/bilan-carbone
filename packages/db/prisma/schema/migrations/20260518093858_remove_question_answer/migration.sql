/*
  Warnings:

  - You are about to drop the `answer_emission_sources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `questions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bilan_carbone"."answer_emission_sources" DROP CONSTRAINT "answer_emission_sources_answer_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."answer_emission_sources" DROP CONSTRAINT "answer_emission_sources_emission_source_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."answers" DROP CONSTRAINT "answers_question_id_fkey";

-- DropForeignKey
ALTER TABLE "bilan_carbone"."answers" DROP CONSTRAINT "answers_study_site_id_fkey";

-- DropTable
DROP TABLE "bilan_carbone"."answer_emission_sources";

-- DropTable
DROP TABLE "bilan_carbone"."answers";

-- DropTable
DROP TABLE "bilan_carbone"."questions";

-- DropEnum
DROP TYPE "bilan_carbone"."QuestionType";
