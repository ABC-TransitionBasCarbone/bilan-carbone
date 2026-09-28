-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "bilan_carbone"."SubPost" ADD VALUE 'DechetsEmisParLOrganisation';
ALTER TYPE "bilan_carbone"."SubPost" ADD VALUE 'DeplacementsBenevoles';
ALTER TYPE "bilan_carbone"."SubPost" ADD VALUE 'BienMatieres';
ALTER TYPE "bilan_carbone"."SubPost" ADD VALUE 'ConsommationsEnergieUtilisationProduits';
ALTER TYPE "bilan_carbone"."SubPost" ADD VALUE 'TeletravailSalariesBenevoles';
ALTER TYPE "bilan_carbone"."SubPost" ADD VALUE 'FinDeVieProduitsVendusFournisBeneficiaires';

-- AlterTable
ALTER TABLE "bilan_carbone"."studies" ADD COLUMN     "sub_posts_config_version" TEXT;
