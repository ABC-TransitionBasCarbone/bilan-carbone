-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "imported_file_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "imported_file_date" TIMESTAMP(3);
