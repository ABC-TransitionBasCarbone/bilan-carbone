/*
  Warnings:

  - You are about to drop the column `emission_source_tag_id` on the `study_emission_sources` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "study_emission_sources" DROP CONSTRAINT "study_emission_sources_emission_source_tag_id_fkey";

-- AlterTable
ALTER TABLE "study_emission_sources" DROP COLUMN "emission_source_tag_id";

-- CreateTable
CREATE TABLE "_TagToEmissionSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TagToEmissionSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TagToEmissionSource_B_index" ON "_TagToEmissionSource"("B");

-- AddForeignKey
ALTER TABLE "_TagToEmissionSource" ADD CONSTRAINT "_TagToEmissionSource_A_fkey" FOREIGN KEY ("A") REFERENCES "emission_source_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToEmissionSource" ADD CONSTRAINT "_TagToEmissionSource_B_fkey" FOREIGN KEY ("B") REFERENCES "study_emission_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
