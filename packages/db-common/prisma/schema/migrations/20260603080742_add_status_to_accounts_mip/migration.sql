/*
  Warnings:

  - Changed the type of `status` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `status` to the `accounts_mip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "common"."UserStatus" AS ENUM ('IMPORTED', 'PENDING_REQUEST', 'VALIDATED', 'ACTIVE');


-- AlterTable
ALTER TABLE "bilan_carbone"."accounts" ALTER COLUMN "status" TYPE "common"."UserStatus" USING "status"::text::"common"."UserStatus";

-- AlterTable
ALTER TABLE "mip"."accounts_mip" ADD COLUMN "status" "common"."UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "mip"."accounts_mip" ALTER COLUMN "status" DROP DEFAULT;

-- DropEnum
DROP TYPE "bilan_carbone"."UserStatus";
