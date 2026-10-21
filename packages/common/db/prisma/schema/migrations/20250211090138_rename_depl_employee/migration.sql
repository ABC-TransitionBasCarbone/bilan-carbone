/*
  Warnings:

  - The values [DeplacementsDesEmployesDansLeCadreDuTravail] on the enum `SubPost` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubPost_new" AS ENUM ('CombustiblesFossiles', 'CombustiblesOrganiques', 'ReseauxDeChaleurEtDeVapeur', 'ReseauxDeFroid', 'Electricite', 'Agriculture', 'EmissionsLieesAuChangementDAffectationDesSolsCas', 'EmissionsLieesALaProductionDeFroid', 'EmissionsLieesAuxProcedesIndustriels', 'AutresEmissionsNonEnergetiques', 'MetauxPlastiquesEtVerre', 'PapiersCartons', 'MateriauxDeConstruction', 'ProduitsChimiquesEtHydrogene', 'NourritureRepasBoissons', 'MatiereDestineeAuxEmballages', 'AutresIntrants', 'BiensEtMatieresEnApprocheMonetaire', 'AchatsDeServices', 'UsagesNumeriques', 'ServicesEnApprocheMonetaire', 'DechetsDEmballagesEtPlastiques', 'DechetsOrganiques', 'DechetsOrduresMenageres', 'DechetsDangereux', 'DechetsBatiments', 'DechetsFuitesOuEmissionsNonEnergetiques', 'EauxUsees', 'FretEntrant', 'FretInterne', 'FretSortant', 'DeplacementsDomicileTravail', 'DeplacementsProfessionnels', 'DeplacementsVisiteurs', 'Batiments', 'AutresInfrastructures', 'Equipements', 'Informatique', 'UtilisationEnResponsabilite', 'UtilisationEnDependance', 'InvestissementsFinanciersRealises', 'ConsommationDEnergieEnFinDeVie', 'TraitementDesDechetsEnFinDeVie', 'FuitesOuEmissionsNonEnergetiques', 'TraitementDesEmballagesEnFinDeVie');
ALTER TABLE "emission_factors" ALTER COLUMN "sub_posts" TYPE "SubPost_new"[] USING ("sub_posts"::text::"SubPost_new"[]);
ALTER TABLE "contributors" ALTER COLUMN "subPost" TYPE "SubPost_new" USING ("subPost"::text::"SubPost_new");
ALTER TABLE "study_emission_sources" ALTER COLUMN "sub_post" TYPE "SubPost_new" USING ("sub_post"::text::"SubPost_new");
ALTER TABLE "export_rules" ALTER COLUMN "sub_post" TYPE "SubPost_new" USING ("sub_post"::text::"SubPost_new");
ALTER TYPE "SubPost" RENAME TO "SubPost_old";
ALTER TYPE "SubPost_new" RENAME TO "SubPost";
DROP TYPE "SubPost_old";
COMMIT;
