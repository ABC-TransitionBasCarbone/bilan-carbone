import { Environment, SubPost } from '@prisma/client'

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
  TourneesAvantPremieres = 'TourneesAvantPremieres',
  SallesEtCabines = 'SallesEtCabines',
  ConfiseriesEtBoissons = 'ConfiseriesEtBoissons',
  Dechets = 'Dechets',
  BilletterieEtCommunication = 'BilletterieEtCommunication',
}

export enum TiltPost {
  ConstructionDesLocaux = 'ConstructionDesLocaux',
  Energies = BCPost.Energies,
  Déchets = BCPost.DechetsDirects,
  FroidEtClim = 'FroidEtClim',
  AutresEmissions = 'AutresEmissions',
  DeplacementsDePersonne = 'DeplacementsDePersonne',
  TransportDeMarchandises = 'TransportDeMarchandises',
  IntrantsBiensEtMatieresTilt = 'IntrantsBiensEtMatieresTilt',
  Alimentation = 'Alimentation',
  IntrantsServices = BCPost.IntrantsServices,
  EquipementsEtImmobilisations = 'EquipementsEtImmobilisations',
  Utilisation = 'Utilisation',
  FinDeVie = BCPost.FinDeVie,
  Teletravail = 'Teletravail',
}

export const Post = { ...BCPost, ...CutPost, ...TiltPost }
export type Post = BCPost | CutPost | TiltPost

export const subPostsByPostBC: Record<BCPost, SubPost[]> = {
  [BCPost.Energies]: [
    SubPost.CombustiblesFossiles,
    SubPost.CombustiblesOrganiques,
    SubPost.ReseauxDeChaleurEtDeVapeur,
    SubPost.ReseauxDeFroid,
    SubPost.Electricite,
  ],
  [BCPost.AutresEmissionsNonEnergetiques]: [
    SubPost.Agriculture,
    SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas,
    SubPost.EmissionsLieesALaProductionDeFroid,
    SubPost.EmissionsLieesAuxProcedesIndustriels,
    SubPost.AutresEmissionsNonEnergetiques,
  ],
  [BCPost.IntrantsBiensEtMatieres]: [
    SubPost.MetauxPlastiquesEtVerre,
    SubPost.PapiersCartons,
    SubPost.MateriauxDeConstruction,
    SubPost.ProduitsChimiquesEtHydrogene,
    SubPost.NourritureRepasBoissons,
    SubPost.MatiereDestineeAuxEmballages,
    SubPost.AutresIntrants,
    SubPost.BiensEtMatieresEnApprocheMonetaire,
  ],
  [BCPost.IntrantsServices]: [SubPost.AchatsDeServices, SubPost.UsagesNumeriques, SubPost.ServicesEnApprocheMonetaire],
  [BCPost.DechetsDirects]: [
    SubPost.DechetsDEmballagesEtPlastiques,
    SubPost.DechetsOrganiques,
    SubPost.DechetsOrduresMenageres,
    SubPost.DechetsDangereux,
    SubPost.DechetsBatiments,
    SubPost.DechetsFuitesOuEmissionsNonEnergetiques,
    SubPost.EauxUsees,
  ],
  [BCPost.Fret]: [SubPost.FretEntrant, SubPost.FretInterne, SubPost.FretSortant],
  [BCPost.Deplacements]: [
    SubPost.DeplacementsDomicileTravail,
    SubPost.DeplacementsProfessionnels,
    SubPost.DeplacementsVisiteurs,
  ],
  [BCPost.Immobilisations]: [
    SubPost.Batiments,
    SubPost.AutresInfrastructures,
    SubPost.Equipements,
    SubPost.Informatique,
  ],
  [BCPost.UtilisationEtDependance]: [
    SubPost.UtilisationEnResponsabilite,
    SubPost.UtilisationEnDependance,
    SubPost.InvestissementsFinanciersRealises,
  ],
  [BCPost.FinDeVie]: [
    SubPost.ConsommationDEnergieEnFinDeVie,
    SubPost.TraitementDesDechetsEnFinDeVie,
    SubPost.FuitesOuEmissionsNonEnergetiques,
    SubPost.TraitementDesEmballagesEnFinDeVie,
  ],
}

export const subPostsByPostCUT: Record<CutPost, SubPost[]> = {
  [CutPost.Fonctionnement]: [
    SubPost.Batiment,
    SubPost.Equipe,
    SubPost.DeplacementsProfessionnels,
    SubPost.Energie,
    SubPost.ActivitesDeBureau,
  ],
  [CutPost.MobiliteSpectateurs]: [SubPost.MobiliteSpectateurs],
  [CutPost.TourneesAvantPremieres]: [SubPost.EquipesRecues],
  [CutPost.SallesEtCabines]: [SubPost.MaterielTechnique, SubPost.AutreMateriel],
  [CutPost.ConfiseriesEtBoissons]: [SubPost.Achats, SubPost.Fret, SubPost.Electromenager],
  [CutPost.Dechets]: [SubPost.DechetsOrdinaires, SubPost.DechetsExceptionnels],
  [CutPost.BilletterieEtCommunication]: [
    SubPost.MaterielDistributeurs,
    SubPost.MaterielCinema,
    SubPost.CommunicationDigitale,
    SubPost.CaissesEtBornes,
  ],
}

export const subPostsByPostTILT: Record<TiltPost, SubPost[]> = {
  [TiltPost.ConstructionDesLocaux]: [SubPost.Batiments, SubPost.AutresInfrastructures],
  [TiltPost.Energies]: subPostsByPostBC[BCPost.Energies],
  [TiltPost.Déchets]: subPostsByPostBC[BCPost.DechetsDirects],
  [TiltPost.FroidEtClim]: [SubPost.FroidEtClim],
  [TiltPost.AutresEmissions]: [
    SubPost.ActivitesAgricoles,
    SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas,
    SubPost.ActivitesIndustrielles,
  ],
  [TiltPost.DeplacementsDePersonne]: [
    SubPost.DeplacementsDomicileTravailSalaries,
    SubPost.DeplacementsDomicileTravailBenevoles,
    SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
    SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles,
    SubPost.DeplacementsDesBeneficiaires,
    SubPost.DeplacementsFabricationDesVehicules,
  ],
  [TiltPost.TransportDeMarchandises]: [
    SubPost.Entrant,
    SubPost.Interne,
    SubPost.Sortant,
    SubPost.TransportFabricationDesVehicules,
  ],
  [TiltPost.IntrantsBiensEtMatieresTilt]: subPostsByPostBC[BCPost.IntrantsBiensEtMatieres].filter(
    (sp) => sp !== SubPost.NourritureRepasBoissons,
  ),
  [TiltPost.Alimentation]: [SubPost.RepasPrisParLesSalaries, SubPost.RepasPrisParLesBenevoles],
  [TiltPost.IntrantsServices]: subPostsByPostBC[BCPost.IntrantsServices],
  [TiltPost.EquipementsEtImmobilisations]: [SubPost.Equipements, SubPost.Informatique],
  [TiltPost.Utilisation]: [
    SubPost.UtilisationEnResponsabiliteConsommationDeBiens,
    SubPost.UtilisationEnResponsabiliteConsommationNumerique,
    SubPost.UtilisationEnResponsabiliteConsommationDEnergie,
    SubPost.UtilisationEnResponsabiliteFuitesEtAutresConsommations,
    SubPost.UtilisationEnDependanceConsommationDeBiens,
    SubPost.UtilisationEnDependanceConsommationNumerique,
    SubPost.UtilisationEnDependanceConsommationDEnergie,
    SubPost.UtilisationEnDependanceFuitesEtAutresConsommations,
    SubPost.InvestissementsFinanciersRealises,
  ],
  [TiltPost.FinDeVie]: subPostsByPostBC[BCPost.FinDeVie],
  [TiltPost.Teletravail]: [SubPost.TeletravailSalaries, SubPost.TeletravailBenevoles],
}

export const environmentPostMapping = {
  [Environment.BC]: BCPost,
  [Environment.CUT]: CutPost,
  [Environment.TILT]: TiltPost,
}

export const subPostsByPost: Record<Post, SubPost[]> = {
  ...subPostsByPostBC,
  ...subPostsByPostCUT,
  ...subPostsByPostTILT,
}
