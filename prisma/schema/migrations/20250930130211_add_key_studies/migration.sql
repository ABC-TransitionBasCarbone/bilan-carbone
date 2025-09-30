-- CreateEnum
CREATE TYPE "public"."DuplicableStudy" AS ENUM ('TrainingExercise');

-- CreateTable
CREATE TABLE "public"."key_studies" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "environment" "public"."Environment" NOT NULL,
    "role" "public"."DuplicableStudy" NOT NULL,

    CONSTRAINT "key_studies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "key_studies_environment_role_key" ON "public"."key_studies"("environment", "role");

-- AddForeignKey
ALTER TABLE "public"."key_studies" ADD CONSTRAINT "key_studies_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "public"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
