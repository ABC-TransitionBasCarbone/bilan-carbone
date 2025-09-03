/*
  Warnings:

  - A unique constraint covering the columns `[name,family_id]` on the table `emission_source_tag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."emission_source_tag_name_study_id_key";

-- AlterTable
ALTER TABLE "public"."emission_source_tag" ADD COLUMN     "family_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "emission_source_tag_name_family_id_key" ON "public"."emission_source_tag"("name", "family_id");

-- AddForeignKey
ALTER TABLE "public"."emission_source_tag" ADD CONSTRAINT "emission_source_tag_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."emission_source_tag_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE emission_source_tag t
SET family_id = f.id
FROM emission_source_tag_families f
WHERE t.study_id = f.study_id
  AND f.name = 'défaut'
  AND t.name IN (
    'Périmètre Interne',
    'Périmètre Bénévoles',
    'Périmètre Bénéficiaires',
    'Numérique'
  );

-- 3. Mettre à jour family_id pour les autres tags
UPDATE emission_source_tag t
SET family_id = f.id
FROM emission_source_tag_families f
WHERE t.study_id = f.study_id
  AND f.name = 'personnalisés'
  AND t.name NOT IN (
    'Périmètre Interne',
    'Périmètre Bénévoles',
    'Périmètre Bénéficiaires',
    'Numérique'
  );

-- DropForeignKey
ALTER TABLE "public"."emission_source_tag" DROP CONSTRAINT "emission_source_tag_study_id_fkey";
ALTER TABLE "public"."emission_source_tag" DROP CONSTRAINT "emission_source_tag_family_id_fkey";

-- AlterTable
ALTER TABLE "public"."emission_source_tag" DROP COLUMN "study_id",
ALTER COLUMN "family_id" SET NOT NULL;-- DropForeignKey

-- AddForeignKey
ALTER TABLE "public"."emission_source_tag" ADD CONSTRAINT "emission_source_tag_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."emission_source_tag_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;