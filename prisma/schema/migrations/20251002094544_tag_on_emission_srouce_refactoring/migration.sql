-- AlterTable
ALTER TABLE "public"."study_tag" RENAME CONSTRAINT "emission_source_tag_pkey" TO "study_tag_pkey";

-- AlterTable
ALTER TABLE "public"."study_tag_families" RENAME CONSTRAINT "emission_source_tag_families_pkey" TO "study_tag_families_pkey";

-- RenameForeignKey
ALTER TABLE "public"."study_tag" RENAME CONSTRAINT "emission_source_tag_family_id_fkey" TO "study_tag_family_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."study_tag_families" RENAME CONSTRAINT "emission_source_tag_families_study_id_fkey" TO "study_tag_families_study_id_fkey";

-- RenameIndex
ALTER INDEX "public"."emission_source_tag_name_family_id_key" RENAME TO "study_tag_name_family_id_key";

-- RenameIndex
ALTER INDEX "public"."emission_source_tag_families_name_study_id_key" RENAME TO "study_tag_families_name_study_id_key";
