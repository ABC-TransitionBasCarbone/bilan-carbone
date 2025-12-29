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
  DechetsDirects = BCPost.DechetsDirects,
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

export enum ClicksonPost {
  EnergiesClickson = 'EnergiesClickson',
  Restauration = 'Restauration',
  DeplacementsClickson = 'DeplacementsClickson',
  Achats = 'Achats',
  ImmobilisationsClickson = 'ImmobilisationsClickson',
}

export const Post = { ...BCPost, ...CutPost, ...TiltPost, ...ClicksonPost }
export type Post = BCPost | CutPost | TiltPost | ClicksonPost

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
    SubPost.AutresDechets,
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
  [TiltPost.DechetsDirects]: subPostsByPostBC[BCPost.DechetsDirects],
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
  [TiltPost.Alimentation]: [
    SubPost.RepasPrisParLesSalaries,
    SubPost.RepasPrisParLesBenevoles,
    SubPost.RepasPrisParLesBeneficiaires,
  ],
  [TiltPost.IntrantsServices]: subPostsByPostBC[BCPost.IntrantsServices],
  [TiltPost.EquipementsEtImmobilisations]: [
    SubPost.EquipementsDesSalaries,
    SubPost.ParcInformatiqueDesSalaries,
    SubPost.EquipementsDesBenevoles,
    SubPost.ParcInformatiqueDesBenevoles,
  ],
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

export const subPostsByPostClickson: Record<ClicksonPost, SubPost[]> = {
  [ClicksonPost.EnergiesClickson]: [SubPost.Electricite, SubPost.Combustibles, SubPost.AutresGaz],
  [ClicksonPost.Restauration]: [
    SubPost.TypesDeRepasServis,
    SubPost.DistributeursAutomatiques,
    SubPost.Fret,
    SubPost.DechetsOrganiques,
  ],
  [ClicksonPost.DeplacementsClickson]: [
    SubPost.TransportDesEleves,
    SubPost.TransportDuPersonnel,
    SubPost.VoyagesScolaires,
  ],
  [ClicksonPost.Achats]: [
    SubPost.Fournitures,
    SubPost.ProduitsChimiques,
    SubPost.EquipementsDeSport,
    SubPost.DechetsRecyclables,
    SubPost.OrduresMenageresResiduelles,
  ],
  [ClicksonPost.ImmobilisationsClickson]: [
    SubPost.Construction,
    SubPost.Renovation,
    SubPost.EquipementsInformatiqueAudiovisuel,
    SubPost.EquipementsDivers,
  ],
}

export const environmentPostMapping = {
  [Environment.BC]: BCPost,
  [Environment.CUT]: CutPost,
  [Environment.TILT]: TiltPost,
  [Environment.CLICKSON]: ClicksonPost,
}

export const subPostsByPost: Record<Post, SubPost[]> = {
  ...subPostsByPostBC,
  ...subPostsByPostCUT,
  ...subPostsByPostTILT,
  ...subPostsByPostClickson,
}

export const environmentSubPostsMapping = {
  [Environment.BC]: subPostsByPostBC,
  [Environment.CUT]: subPostsByPostCUT,
  [Environment.TILT]: subPostsByPostTILT,
  [Environment.CLICKSON]: subPostsByPostClickson,
}

export const subPostTiltToBcSubPostMapping: Partial<Record<SubPost, SubPost>> = {
  [SubPost.FroidEtClim]: SubPost.EmissionsLieesALaProductionDeFroid,
  [SubPost.ActivitesAgricoles]: SubPost.Agriculture,
  [SubPost.ActivitesIndustrielles]: SubPost.EmissionsLieesAuxProcedesIndustriels,
  [SubPost.DeplacementsDomicileTravailSalaries]: SubPost.DeplacementsDomicileTravail,
  [SubPost.DeplacementsDomicileTravailBenevoles]: SubPost.DeplacementsDomicileTravail,
  [SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries]: SubPost.DeplacementsProfessionnels,
  [SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles]: SubPost.DeplacementsProfessionnels,
  [SubPost.DeplacementsDesBeneficiaires]: SubPost.DeplacementsVisiteurs,
  [SubPost.DeplacementsFabricationDesVehicules]: SubPost.Equipements,
  [SubPost.Entrant]: SubPost.FretEntrant,
  [SubPost.Interne]: SubPost.FretInterne,
  [SubPost.Sortant]: SubPost.FretSortant,
  [SubPost.TransportFabricationDesVehicules]: SubPost.Equipements,
  [SubPost.RepasPrisParLesSalaries]: SubPost.NourritureRepasBoissons,
  [SubPost.RepasPrisParLesBenevoles]: SubPost.NourritureRepasBoissons,
  [SubPost.RepasPrisParLesBeneficiaires]: SubPost.NourritureRepasBoissons,
  [SubPost.EquipementsDesSalaries]: SubPost.Equipements,
  [SubPost.ParcInformatiqueDesSalaries]: SubPost.Informatique,
  [SubPost.EquipementsDesBenevoles]: SubPost.Equipements,
  [SubPost.ParcInformatiqueDesBenevoles]: SubPost.Informatique,
  [SubPost.UtilisationEnResponsabiliteConsommationDeBiens]: SubPost.UtilisationEnResponsabilite,
  [SubPost.UtilisationEnResponsabiliteConsommationNumerique]: SubPost.UtilisationEnResponsabilite,
  [SubPost.UtilisationEnResponsabiliteConsommationDEnergie]: SubPost.UtilisationEnResponsabilite,
  [SubPost.UtilisationEnResponsabiliteFuitesEtAutresConsommations]: SubPost.UtilisationEnResponsabilite,
  [SubPost.UtilisationEnDependanceConsommationDeBiens]: SubPost.UtilisationEnDependance,
  [SubPost.UtilisationEnDependanceConsommationNumerique]: SubPost.UtilisationEnDependance,
  [SubPost.UtilisationEnDependanceConsommationDEnergie]: SubPost.UtilisationEnDependance,
  [SubPost.UtilisationEnDependanceFuitesEtAutresConsommations]: SubPost.UtilisationEnDependance,
  [SubPost.TeletravailSalaries]: SubPost.Electricite,
  [SubPost.TeletravailBenevoles]: SubPost.Electricite,
}

export const convertTiltSubPostToBCSubPost = (subPost: SubPost): SubPost => {
  return subPostTiltToBcSubPostMapping[subPost] ?? subPost
}

const getSubPostBCToSubPostTiltMapping = (): Partial<Record<SubPost, SubPost[]>> => {
  const result = {} as Partial<Record<SubPost, SubPost[]>>
  const tiltSubPostList = Object.values(subPostsByPostTILT).flat()
  for (const tiltSubPost of tiltSubPostList) {
    const bcSubPost = convertTiltSubPostToBCSubPost(tiltSubPost)
    if (result[bcSubPost]) {
      result[bcSubPost].push(tiltSubPost as SubPost)
    } else {
      result[bcSubPost] = [tiltSubPost as SubPost]
    }
  }
  return result as Partial<Record<SubPost, SubPost[]>>
}

export const subPostBCToSubPostTiltMapping = getSubPostBCToSubPostTiltMapping()

export const convertCountToBilanCarbone = (
  results: { post: string; children: { post: string; value: number }[] }[],
): { [key: string]: number } => {
  const allPossibleCategories = new Set(Object.values(cutSubPostToBCPostMapping))
  const aggregatedResults: { [key: string]: number } = {}

  allPossibleCategories.forEach((category) => {
    aggregatedResults[category] = 0
  })

  results.forEach((result) => {
    if (result.post === 'total') {
      return
    }

    result.children.forEach((child) => {
      const bilanCarbonePost = cutSubPostToBCPostMapping[child.post as keyof typeof cutSubPostToBCPostMapping]
      if (bilanCarbonePost) {
        aggregatedResults[bilanCarbonePost] = aggregatedResults[bilanCarbonePost] + child.value
      }
    })
  })

  return aggregatedResults
}

export const cutSubPostToBCPostMapping: Partial<Record<SubPost, BCPost>> = {
  [SubPost.Batiment]: BCPost.Immobilisations,
  [SubPost.Equipe]: BCPost.Deplacements,
  [SubPost.DeplacementsProfessionnels]: BCPost.Deplacements,
  [SubPost.Energie]: BCPost.Energies,
  [SubPost.ActivitesDeBureau]: BCPost.IntrantsServices,
  [SubPost.MobiliteSpectateurs]: BCPost.Deplacements,
  [SubPost.EquipesRecues]: BCPost.Deplacements,
  [SubPost.MaterielTechnique]: BCPost.Immobilisations,
  [SubPost.AutreMateriel]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.Achats]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.Electromenager]: BCPost.Immobilisations,
  [SubPost.Fret]: BCPost.Fret,
  [SubPost.DechetsOrdinaires]: BCPost.DechetsDirects,
  [SubPost.DechetsExceptionnels]: BCPost.DechetsDirects,
  [SubPost.MaterielDistributeurs]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.MaterielCinema]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.CommunicationDigitale]: BCPost.Immobilisations,
  [SubPost.CaissesEtBornes]: BCPost.Immobilisations,
}
