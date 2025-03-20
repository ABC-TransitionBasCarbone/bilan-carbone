-- AlterEnum
BEGIN;
CREATE TYPE "UserChecklist_new" AS ENUM ('CreateAccount', 'AddCollaborator', 'AddClient', 'AddSiteCR', 'AddSiteOrga', 'CreateFirstStudy', 'CreateFirstEmissionSource', 'ConsultResults', 'Completed');
ALTER TABLE "user_checked_steps" ALTER COLUMN "step" TYPE "UserChecklist_new" USING ("step"::text::"UserChecklist_new");
ALTER TYPE "UserChecklist" RENAME TO "UserChecklist_old";
ALTER TYPE "UserChecklist_new" RENAME TO "UserChecklist";
DROP TYPE "UserChecklist_old";
COMMIT;
