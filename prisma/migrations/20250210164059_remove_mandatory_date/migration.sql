-- AlterTable
ALTER TABLE "organizations" ALTER COLUMN "imported_file_date" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "imported_file_date" DROP NOT NULL;
