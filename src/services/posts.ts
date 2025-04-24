import { BASE, CUT } from '@/store/AppEnvironment'
import { SubPost } from '@prisma/client'

export enum BCPost {
  Energies = 'Energies',
  AutresEmissionsNonEnergetiques = 'AutresEmissionsNonEnergetiques',
  IntrantsBiensEtMatieres = 'IntrantsBiensEtMatieres',
  IntrantsServices = 'IntrantsServices',
  DechetsDirects = 'DechetsDirects',
  Fret = 'Fret',
  Deplacements = 'Deplacements',
  Immobilisations = 'Immobilisations',
  UtilisationEtDependance = 'UtilisationEtDependance',
  FinDeVie = 'FinDeVie',
}

export enum CutPost {
  Fonctionnement = 'Fonctionnement',
  MobiliteSpectateurs = 'MobiliteSpectateurs',
  TourneesAvantPremiere = 'TourneesAvantPremiere',
  SallesEtCabines = 'SallesEtCabines',
  ConfiseriesEtBoissons = 'ConfiseriesEtBoissons',
  Dechets = 'Dechets',
  BilletterieEtCommunication = 'BilletterieEtCommunication',
}

export const Post = { ...BCPost, ...CutPost }
export type Post = BCPost | CutPost

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
  [Post.IntrantsBiensEtMatieres]: [
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
    SubPost.DeplacementsProfessionnels,
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

  [Post.Fonctionnement]: [
    SubPost.Batiment,
    SubPost.Equipe,
    SubPost.DeplacementsProfessionnels,
    SubPost.Energie,
    SubPost.ActivitesDeBureau,
  ],
  [Post.MobiliteSpectateurs]: [SubPost.MobiliteSpectateurs],
  [Post.TourneesAvantPremiere]: [SubPost.EquipesRecues],
  [Post.SallesEtCabines]: [SubPost.MaterielTechnique, SubPost.AutreMateriel],
  [Post.ConfiseriesEtBoissons]: [SubPost.Achats, SubPost.Fret, SubPost.Electromenager],
  [Post.Dechets]: [SubPost.DechetsOrdinaires, SubPost.DechetsExceptionnels],
  [Post.BilletterieEtCommunication]: [
    SubPost.MaterielDistributeurs,
    SubPost.MaterielCinema,
    SubPost.CommunicationDigitale,
    SubPost.CaissesEtBornes,
  ],
}

export const environmentPostMapping = {
  [BASE]: BCPost,
  [CUT]: CutPost,
}
