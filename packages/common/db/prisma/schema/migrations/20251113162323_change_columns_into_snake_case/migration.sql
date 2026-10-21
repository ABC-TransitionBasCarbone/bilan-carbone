-- DropForeignKey
ALTER TABLE "public"."answers" DROP CONSTRAINT "answers_studySiteId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "public"."answers_question_id_studySiteId_key";

-- Drop the existing primary key constraint
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_pkey";

-- Rename columns in "actions"
ALTER TABLE "actions"
  RENAME COLUMN "detailedDescription" TO "detailed_description";
ALTER TABLE "actions"
  RENAME COLUMN "potentialDeduction" TO "potential_deduction";
ALTER TABLE "actions"
  RENAME COLUMN "reductionValue" TO "reduction_value";

-- Rename columns in "answers"
ALTER TABLE "answers"
  RENAME COLUMN "studySiteId" TO "study_site_id";

-- Rename columns in "external_studies"
ALTER TABLE "external_studies"
  RENAME COLUMN "totalCo2" TO "total_co2";

-- Rename columns in "opening_hours"
ALTER TABLE "opening_hours"
  RENAME COLUMN "closeHour" TO "close_hour";
ALTER TABLE "opening_hours"
  RENAME COLUMN "isHoliday" TO "is_holiday";
ALTER TABLE "opening_hours"
  RENAME COLUMN "openHour" TO "open_hour";

-- Rename columns in "sites"
ALTER TABLE "sites"
  RENAME COLUMN "postalCode" TO "postal_code";

-- Rename columns in "study_sites"
ALTER TABLE "study_sites"
  RENAME COLUMN "distanceToParis" TO "distance_to_paris";
ALTER TABLE "study_sites"
  RENAME COLUMN "numberOfOpenDays" TO "number_of_openDays";
ALTER TABLE "study_sites"
  RENAME COLUMN "numberOfSessions" TO "number_of_sessions";
ALTER TABLE "study_sites"
  RENAME COLUMN "numberOfTickets" TO "number_of_tickets";

-- Rename columns in "contributors"
ALTER TABLE "contributors"
  RENAME COLUMN "subPost" TO "sub_post";

ALTER TABLE "contributors"
  ADD CONSTRAINT "contributors_pkey" PRIMARY KEY ("study_id", "account_id", "sub_post");

-- Recreate the index with the new column name
CREATE UNIQUE INDEX "answers_question_id_study_site_id_key"
  ON "answers" ("question_id", "study_site_id");

-- Recreate the foreign key with the new column name
ALTER TABLE "answers"
  ADD CONSTRAINT "answers_study_site_id_fkey"
  FOREIGN KEY ("study_site_id")
  REFERENCES "study_sites" ("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
