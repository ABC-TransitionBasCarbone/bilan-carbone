ALTER TYPE "CRUserChecklist" RENAME TO "UserChecklist";
ALTER TABLE "user_checked_steps" ALTER COLUMN "step" TYPE "UserChecklist" USING step::text::"UserChecklist";
