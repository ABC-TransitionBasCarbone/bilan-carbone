/*
  Warnings:

  - A unique constraint covering the columns `[cnc_code]` on the table `cncs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."cncs" ADD COLUMN     "cnc_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "cncs_cnc_code_key" ON "public"."cncs"("cnc_code");
