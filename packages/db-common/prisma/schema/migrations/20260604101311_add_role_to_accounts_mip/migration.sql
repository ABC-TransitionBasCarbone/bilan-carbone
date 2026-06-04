-- Custom migration Claude
-- Déplacer l'enum Role de bilan_carbone vers common
ALTER TYPE "bilan_carbone"."Role" SET SCHEMA "common";

-- AlterTable accounts_mip : ajout de la colonne role
-- (table vide en dev, sinon ajouter un DEFAULT temporaire)
ALTER TABLE "mip"."accounts_mip" ADD COLUMN "role" "common"."Role" NOT NULL;