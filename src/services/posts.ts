import { SubPost } from '@prisma/client'

enum Post {
  Energies,
  AutresEmissionsNonEnergetiques,
  IntrantsBienEtMatieres,
  IntrantsServices,
  DechetsDirects,
  Fret,
  Deplacements,
  Immobilisations,
  UtilisationEtDependance,
  FinDeVie,
}

export const subPostsByPost: Record<Post, SubPost[]> = {
  [Post.Energies]: [
    SubPost.CombustiblesFossiles,
    SubPost.CombustiblesOrganiques,
    SubPost.ReseauxDeChaleurEtDeVapeur,
    SubPost.ReseauxDeFroid,
    SubPost.Electricite,
  ],
  [Post.AutresEmissionsNonEnergetiques]: [
    SubPost.Agriculture,
    SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas,
    SubPost.EmissionsLieesALaProductionDeFroid,
    SubPost.EmissionsLieesAuxProcedesIndustriels,
    SubPost.AutresEmissionsNonEnergetiques,
  ],
  [Post.IntrantsBienEtMatieres]: [
    SubPost.MetauxPlastiquesEtVerre,
    SubPost.PapiersCartons,
    SubPost.MateriauxDeConstruction,
    SubPost.ProduitsChimiquesEtHydrogene,
    SubPost.NourritureRepasBoissons,
    SubPost.MatiereDestineeAuxEmballages,
    SubPost.AutresIntrants,
    SubPost.BiensEtMatieresEnApprocheMonetaire,
  ],
  [Post.IntrantsServices]: [SubPost.AchatsDeServices, SubPost.UsagesNumeriques, SubPost.ServicesEnApprocheMonetaire],
  [Post.DechetsDirects]: [
    SubPost.DechetsDEmballagesEtPlastiques,
    SubPost.DechetsOrganiques,
    SubPost.DechetsOrduresMenageres,
    SubPost.DechetsDangereux,
    SubPost.DechetsBatiments,
    SubPost.DechetsFuitesOuEmissionsNonEnergetiques,
    SubPost.EauxUsees,
  ],
  [Post.Fret]: [SubPost.FretEntrant, SubPost.FretInterne, SubPost.FretSortant],
  [Post.Deplacements]: [
    SubPost.DeplacementsDomicileTravail,
    SubPost.DeplacementsDesEmployesDansLeCadreDuTravail,
    SubPost.DeplacementsVisiteurs,
  ],
  [Post.Immobilisations]: [SubPost.Batiments, SubPost.AutresInfrastructures, SubPost.Equipements, SubPost.Informatique],
  [Post.UtilisationEtDependance]: [
    SubPost.UtilisationEnResponsabilite,
    SubPost.UtilisationEnDependance,
    SubPost.InvestissementsFinanciersRealises,
  ],
  [Post.FinDeVie]: [
    SubPost.ConsommationDEnergieEnFinDeVie,
    SubPost.TraitementDesDechetsEnFinDeVie,
    SubPost.FuitesOuEmissionsNonEnergetiques,
    SubPost.TraitementDesEmballagesEnFinDeVie,
  ],
}
