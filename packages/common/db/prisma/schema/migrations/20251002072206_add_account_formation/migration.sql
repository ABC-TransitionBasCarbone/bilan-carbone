-- AlterTable
ALTER TABLE "public"."accounts" ADD COLUMN     "formation_end_date" TIMESTAMP(3),
ADD COLUMN     "formation_name" TEXT,
ADD COLUMN     "formation_start_date" TIMESTAMP(3);
