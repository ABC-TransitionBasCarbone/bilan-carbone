-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubPost" ADD VALUE 'Combustibles';
ALTER TYPE "SubPost" ADD VALUE 'AutresGaz';
ALTER TYPE "SubPost" ADD VALUE 'TypesDeRepasServis';
ALTER TYPE "SubPost" ADD VALUE 'DistributeursAutomatiques';
ALTER TYPE "SubPost" ADD VALUE 'TransportDesEleves';
ALTER TYPE "SubPost" ADD VALUE 'TransportDuPersonnel';
ALTER TYPE "SubPost" ADD VALUE 'VoyagesScolaires';
ALTER TYPE "SubPost" ADD VALUE 'Fournitures';
ALTER TYPE "SubPost" ADD VALUE 'ProduitsChimiques';
ALTER TYPE "SubPost" ADD VALUE 'EquipementsDeSport';
ALTER TYPE "SubPost" ADD VALUE 'DechetsRecyclables';
ALTER TYPE "SubPost" ADD VALUE 'OrduresMenageresResiduelles';
ALTER TYPE "SubPost" ADD VALUE 'Construction';
ALTER TYPE "SubPost" ADD VALUE 'Renovation';
ALTER TYPE "SubPost" ADD VALUE 'EquipementsInformatiqueAudiovisuel';
ALTER TYPE "SubPost" ADD VALUE 'EquipementsDivers';
