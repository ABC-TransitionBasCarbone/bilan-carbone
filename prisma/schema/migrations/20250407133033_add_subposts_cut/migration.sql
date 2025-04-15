-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubPost" ADD VALUE 'Batiment';
ALTER TYPE "SubPost" ADD VALUE 'Equipe';
ALTER TYPE "SubPost" ADD VALUE 'Energie';
ALTER TYPE "SubPost" ADD VALUE 'ActivitesDeBureau';
ALTER TYPE "SubPost" ADD VALUE 'MobiliteSpectateurs';
ALTER TYPE "SubPost" ADD VALUE 'EquipesRecues';
ALTER TYPE "SubPost" ADD VALUE 'MaterielTechnique';
ALTER TYPE "SubPost" ADD VALUE 'AutreMateriel';
ALTER TYPE "SubPost" ADD VALUE 'Achats';
ALTER TYPE "SubPost" ADD VALUE 'Fret';
ALTER TYPE "SubPost" ADD VALUE 'Electromenager';
ALTER TYPE "SubPost" ADD VALUE 'DechetsOrdinaires';
ALTER TYPE "SubPost" ADD VALUE 'DechetsExceptionnels';
ALTER TYPE "SubPost" ADD VALUE 'MaterielDistributeurs';
ALTER TYPE "SubPost" ADD VALUE 'MaterielCinema';
ALTER TYPE "SubPost" ADD VALUE 'CommunicationDigitale';
ALTER TYPE "SubPost" ADD VALUE 'CaissesEtBornes';
