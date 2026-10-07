-- CreateEnum
CREATE TYPE "public"."DuplicableStudy" AS ENUM ('TrainingExercise');

-- CreateTable
CREATE TABLE "public"."study_templates" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "environment" "public"."Environment" NOT NULL,
    "template" "public"."DuplicableStudy" NOT NULL,

    CONSTRAINT "study_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_templates_environment_template_key" ON "public"."study_templates"("environment", "template");

-- AddForeignKey
ALTER TABLE "public"."study_templates" ADD CONSTRAINT "study_templates_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
