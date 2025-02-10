-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "imported_file_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "imported_file_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
