/*
  Warnings:

  - The values [CR] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `studies` table. All the data in the column will be lost.
  - You are about to drop the column `adminRole` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `training` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `cr_organizations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `level` to the `studies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Level" AS ENUM ('Initial', 'Standard', 'Advanced');

-- CreateEnum
CREATE TYPE "StudyRole" AS ENUM ('Validator', 'Editor', 'Reader');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'HR', 'DEFAULT');
ALTER TABLE "licenses" ALTER COLUMN "rights" TYPE "Role_new"[] USING ("rights"::text::"Role_new"[]);
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "cr_organizations" DROP CONSTRAINT "cr_organizations_organization_id_fkey";

-- DropForeignKey
ALTER TABLE "cr_organizations" DROP CONSTRAINT "cr_organizations_userId_fkey";

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "is_cr" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "studies" DROP COLUMN "type",
ADD COLUMN     "level" "Level" NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "adminRole",
DROP COLUMN "training",
ADD COLUMN     "level" "Level" NOT NULL;

-- DropTable
DROP TABLE "cr_organizations";

-- DropEnum
DROP TYPE "AdminRole";

-- DropEnum
DROP TYPE "StudyType";

-- DropEnum
DROP TYPE "TrainingStatus";

-- CreateTable
CREATE TABLE "users_on_study" (
    "study_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "StudyRole" NOT NULL,

    CONSTRAINT "users_on_study_pkey" PRIMARY KEY ("study_id","userId")
);

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_study" ADD CONSTRAINT "users_on_study_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_study" ADD CONSTRAINT "users_on_study_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
