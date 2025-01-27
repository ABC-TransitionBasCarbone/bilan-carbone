-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false;

UPDATE "organizations" SET "onboarded" = true;
