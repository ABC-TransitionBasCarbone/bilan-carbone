-- AlterTable
ALTER TABLE "study_emission_sources" ADD COLUMN     "emission_source_tag_id" TEXT;

-- CreateTable
CREATE TABLE "emission_source_tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,

    CONSTRAINT "emission_source_tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emission_source_tag_name_study_id_key" ON "emission_source_tag"("name", "study_id");

-- AddForeignKey
ALTER TABLE "emission_source_tag" ADD CONSTRAINT "emission_source_tag_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_emission_sources" ADD CONSTRAINT "study_emission_sources_emission_source_tag_id_fkey" FOREIGN KEY ("emission_source_tag_id") REFERENCES "emission_source_tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;
