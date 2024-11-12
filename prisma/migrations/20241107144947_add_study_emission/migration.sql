-- CreateTable
CREATE TABLE "study_emission_sources" (
    "id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "subPost" "SubPost" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "study_emission_sources_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
