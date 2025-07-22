-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubPost" ADD VALUE 'FroidEtClim';
ALTER TYPE "SubPost" ADD VALUE 'ActivitesAgricoles';
ALTER TYPE "SubPost" ADD VALUE 'ActivitesIndustrielles';
ALTER TYPE "SubPost" ADD VALUE 'DeplacementsDomicileTravailSalaries';
ALTER TYPE "SubPost" ADD VALUE 'DeplacementsDomicileTravailBenevoles';
ALTER TYPE "SubPost" ADD VALUE 'DeplacementsDansLeCadreDUneMissionAssociativeSalaries';
ALTER TYPE "SubPost" ADD VALUE 'DeplacementsDansLeCadreDUneMissionAssociativeBenevoles';
ALTER TYPE "SubPost" ADD VALUE 'DeplacementsDesBeneficiaires';
ALTER TYPE "SubPost" ADD VALUE 'DeplacementsFabricationDesVehicules';
ALTER TYPE "SubPost" ADD VALUE 'Entrant';
ALTER TYPE "SubPost" ADD VALUE 'Interne';
ALTER TYPE "SubPost" ADD VALUE 'Sortant';
ALTER TYPE "SubPost" ADD VALUE 'TransportFabricationDesVehicules';
ALTER TYPE "SubPost" ADD VALUE 'RepasPrisParLesSalaries';
ALTER TYPE "SubPost" ADD VALUE 'RepasPrisParLesBenevoles';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnResponsabiliteConsommationDeBiens';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnResponsabiliteConsommationNumerique';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnResponsabiliteConsommationDEnergie';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnResponsabiliteFuitesEtAutresConsommations';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnDependanceConsommationDeBiens';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnDependanceConsommationNumerique';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnDependanceConsommationDEnergie';
ALTER TYPE "SubPost" ADD VALUE 'UtilisationEnDependanceFuitesEtAutresConsommations';
ALTER TYPE "SubPost" ADD VALUE 'TeletravailSalaries';
ALTER TYPE "SubPost" ADD VALUE 'TeletravailBenevoles';
ALTER TYPE "SubPost" ADD VALUE 'Numerique';
