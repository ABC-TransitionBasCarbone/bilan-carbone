-- Step 1: Rename tables
ALTER TABLE "emission_source_tag_families"
  RENAME TO "study_tag_families";

ALTER TABLE "emission_source_tag"
  RENAME TO "study_tag";

ALTER TABLE "_TagToEmissionSource"
  RENAME TO "emission_source_tag";

-- Step 2: Rename primary key constraints
ALTER TABLE "study_tag"
  RENAME CONSTRAINT "emission_source_tag_pkey" TO "study_tag_pkey";

-- Step 3: Rename columns in junction table
ALTER TABLE "emission_source_tag"
  RENAME COLUMN "A" TO "tag_id";

ALTER TABLE "emission_source_tag"
  RENAME COLUMN "B" TO "emission_source_id";

-- Step 3: Add metadata columns to study_tag
ALTER TABLE "study_tag"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 4: Add metadata columns to junction table
ALTER TABLE "emission_source_tag"
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 5: Drop old foreign key constraints (keep PK for now)
ALTER TABLE "emission_source_tag"
  DROP CONSTRAINT IF EXISTS "_TagToEmissionSource_A_fkey",
  DROP CONSTRAINT IF EXISTS "_TagToEmissionSource_B_fkey";

-- Step 6: Drop old primary key and add new one with renamed columns
ALTER TABLE "emission_source_tag"
  DROP CONSTRAINT IF EXISTS "_TagToEmissionSource_AB_pkey",
  ADD CONSTRAINT "emission_source_tag_pkey"
    PRIMARY KEY ("emission_source_id", "tag_id");

-- Step 7: Add new foreign key constraints
ALTER TABLE "emission_source_tag"
  ADD CONSTRAINT "emission_source_tag_tag_id_fkey"
    FOREIGN KEY ("tag_id") REFERENCES "study_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "emission_source_tag_emission_source_id_fkey"
    FOREIGN KEY ("emission_source_id") REFERENCES "study_emission_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 8: Recreate indexes
DROP INDEX IF EXISTS "_TagToEmissionSource_A_index";
DROP INDEX IF EXISTS "_TagToEmissionSource_B_index";
CREATE INDEX "emission_source_tag_emission_source_id_idx"
  ON "emission_source_tag"("emission_source_id");
CREATE INDEX "emission_source_tag_tag_id_idx"
  ON "emission_source_tag"("tag_id");

ALTER TABLE "study_tag_families"
  RENAME CONSTRAINT "emission_source_tag_families_pkey" TO "study_tag_families_pkey";

-- Step 10: Rename foreign key constraints
ALTER TABLE "study_tag"
  RENAME CONSTRAINT "emission_source_tag_family_id_fkey" TO "study_tag_family_id_fkey";

ALTER TABLE "study_tag_families"
  RENAME CONSTRAINT "emission_source_tag_families_study_id_fkey" TO "study_tag_families_study_id_fkey";

-- Step 11: Rename unique indexes
ALTER INDEX "emission_source_tag_name_family_id_key"
  RENAME TO "study_tag_name_family_id_key";

ALTER INDEX "emission_source_tag_families_name_study_id_key"
  RENAME TO "study_tag_families_name_study_id_key";
