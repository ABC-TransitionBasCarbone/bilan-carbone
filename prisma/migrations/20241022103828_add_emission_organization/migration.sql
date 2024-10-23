-- AlterTable
ALTER TABLE "emissions" ADD COLUMN     "organization_id" TEXT,
ALTER COLUMN "location" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "emissions" ADD CONSTRAINT "emissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
