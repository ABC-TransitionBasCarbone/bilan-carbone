/*
  Warnings:

  - The values [DEFAULT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'GESTIONNAIRE', 'COLLABORATOR');
ALTER TABLE "licenses" ALTER COLUMN "rights" TYPE "Role_new"[] USING ("rights"::text::"Role_new"[]);
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;
