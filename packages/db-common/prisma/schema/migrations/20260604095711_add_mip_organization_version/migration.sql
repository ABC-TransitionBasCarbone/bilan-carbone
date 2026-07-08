-- Migration custom claude
-- Déplacer la table organizations de bilan_carbone vers common
ALTER TABLE "bilan_carbone"."organizations" SET SCHEMA "common";

-- CreateTable
CREATE TABLE "mip"."organization_versions_mip" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    CONSTRAINT "organization_versions_mip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mip"."organization_versions_mip" ADD CONSTRAINT "organization_versions_mip_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "common"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;