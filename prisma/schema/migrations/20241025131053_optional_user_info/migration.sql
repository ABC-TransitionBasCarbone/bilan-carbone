/*
  Warnings:

  - The values [HR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `is_active` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'GESTIONNAIRE', 'DEFAULT');
ALTER TABLE "licenses" ALTER COLUMN "rights" TYPE "Role_new"[] USING ("rights"::text::"Role_new"[]);
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;
