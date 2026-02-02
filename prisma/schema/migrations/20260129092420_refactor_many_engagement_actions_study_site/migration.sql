/* CUSTOM MIGRATION NOT GENERATED WITH PRISMA */

ALTER TABLE "public"."study_sites"
DROP CONSTRAINT "study_sites_engagementActionId_fkey";

CREATE TABLE "_EngagementActionToStudySite" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EngagementActionToStudySite_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_EngagementActionToStudySite_B_index"
ON "_EngagementActionToStudySite"("B");

ALTER TABLE "_EngagementActionToStudySite"
ADD CONSTRAINT "_EngagementActionToStudySite_A_fkey"
FOREIGN KEY ("A") REFERENCES "EngagementAction"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_EngagementActionToStudySite"
ADD CONSTRAINT "_EngagementActionToStudySite_B_fkey"
FOREIGN KEY ("B") REFERENCES "study_sites"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "_EngagementActionToStudySite" ("A", "B")
SELECT DISTINCT "engagementActionId" AS "A", "id" AS "B"
FROM "study_sites"
WHERE "engagementActionId" IS NOT NULL;

ALTER TABLE "study_sites"
DROP COLUMN "engagementActionId";
