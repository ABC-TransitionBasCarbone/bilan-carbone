-- AlterTable
ALTER TABLE "mip"."accounts_mip" ADD COLUMN     "organization_version_mip_id" TEXT;

-- AddForeignKey
ALTER TABLE "mip"."accounts_mip" ADD CONSTRAINT "accounts_mip_organization_version_mip_id_fkey" FOREIGN KEY ("organization_version_mip_id") REFERENCES "mip"."organization_versions_mip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
