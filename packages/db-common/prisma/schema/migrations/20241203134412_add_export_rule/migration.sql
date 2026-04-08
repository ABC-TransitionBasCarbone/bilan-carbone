/*
  Warnings:

  - The `caracterisation` column on the `study_emission_sources` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `emission_factor_parts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EmissionFactorPartType" AS ENUM ('CarburantAmontCombustion', 'Amont', 'Intrants', 'Combustion', 'TransportEtDistribution', 'Energie', 'Fabrication', 'Traitement', 'Collecte', 'Autre', 'Amortissement', 'Incineration', 'EmissionsFugitives', 'Fuites', 'Transport', 'CombustionALaCentrale', 'Pertes');

-- CreateEnum
CREATE TYPE "EmissionSourceCaracterisation" AS ENUM ('Operated', 'NotOperated', 'OperatedProcedeed', 'OperatedFugitive', 'NotOperatedSupported', 'NotOperatedNotSupported', 'Rented', 'FinalClient');

-- AlterTable
ALTER TABLE "emission_factor_parts" DROP COLUMN "type",
ADD COLUMN     "type" "EmissionFactorPartType" NOT NULL;

-- AlterTable
ALTER TABLE "study_emission_sources" DROP COLUMN "caracterisation",
ADD COLUMN     "caracterisation" "EmissionSourceCaracterisation";

-- CreateTable
CREATE TABLE "export_rules" (
    "id" TEXT NOT NULL,
    "export" "Export" NOT NULL,
    "sub_post" "SubPost" NOT NULL,
    "type" "EmissionFactorPartType",
    "operated" TEXT,
    "not_operated" TEXT,
    "operated_procedeed" TEXT,
    "operated_fugitive" TEXT,
    "not_operated_supported" TEXT,
    "not_operated_not_supported" TEXT,
    "rented" TEXT,
    "final_client" TEXT,

    CONSTRAINT "export_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "export_rules_export_sub_post_type_key" ON "export_rules"("export", "sub_post", "type");
