-- AlterTable
ALTER TABLE "user_checked_steps" DROP COLUMN "user_id",
ALTER COLUMN "account_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "imported_file_date",
DROP COLUMN "organization_id",
DROP COLUMN "role";

-- AlterTable
ALTER TABLE "users_on_study" DROP CONSTRAINT "users_on_study_pkey",
DROP COLUMN "user_id",
ALTER COLUMN "account_id" SET NOT NULL,
ADD CONSTRAINT "users_on_study_pkey" PRIMARY KEY ("study_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_checked_steps_account_id_step_key" ON "user_checked_steps"("account_id", "step");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_account_id_fkey" FOREIGN KEY ("uploader_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_created_by_account_id_fkey" FOREIGN KEY ("created_by_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studies" ADD CONSTRAINT "studies_organizationVersion_id_fkey" FOREIGN KEY ("organizationVersion_id") REFERENCES "organization_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_on_study" ADD CONSTRAINT "users_on_study_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;