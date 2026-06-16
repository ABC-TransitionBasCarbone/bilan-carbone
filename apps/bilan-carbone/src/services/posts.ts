import { Environment, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { BCPost, ClicksonPost, CutPost, TiltAdvancedPost, TiltSimplifiedPost } from './posts.enums'

// Re-export enums for backward compatibility
export { BCPost, ClicksonPost, CutPost, TiltAdvancedPost, TiltSimplifiedPost }

export const TiltPost = { ...TiltAdvancedPost, ...TiltSimplifiedPost }

export const Post = { ...BCPost, ...CutPost, ...TiltPost, ...ClicksonPost }
export type SimplifiedPost = CutPost | ClicksonPost | TiltSimplifiedPost
export type Post = BCPost | TiltAdvancedPost | TiltSimplifiedPost | CutPost | ClicksonPost

export type BaseResultsByPost = {
  post: Post | SubPost | 'total'
  label: string
  value: number
  children: BaseResultsByPost[]
}

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

export const subPostsByPostTILT: Record<TiltAdvancedPost, SubPost[]> = {
  [TiltAdvancedPost.ConstructionDesLocaux]: [SubPost.Batiments, SubPost.AutresInfrastructures],
  [TiltAdvancedPost.Energies]: subPostsByPostBC[BCPost.Energies],
  [TiltAdvancedPost.DechetsDirects]: subPostsByPostBC[BCPost.DechetsDirects],
  [TiltAdvancedPost.FroidEtClim]: [SubPost.FroidEtClim],
  [TiltAdvancedPost.AutresEmissions]: [
    SubPost.ActivitesAgricoles,
    SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas,
    SubPost.ActivitesIndustrielles,
  ],
  [TiltAdvancedPost.DeplacementsDePersonne]: [
    SubPost.DeplacementsDomicileTravailSalaries,
    SubPost.DeplacementsDomicileTravailBenevoles,
    SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
    SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles,
    SubPost.DeplacementsDesBeneficiaires,
    SubPost.DeplacementsFabricationDesVehicules,
  ],
  [TiltAdvancedPost.TransportDeMarchandises]: [
    SubPost.Entrant,
    SubPost.Interne,
    SubPost.Sortant,
    SubPost.TransportFabricationDesVehicules,
  ],
  [TiltAdvancedPost.IntrantsBiensEtMatieresTilt]: subPostsByPostBC[BCPost.IntrantsBiensEtMatieres].filter(
    (sp) => sp !== SubPost.NourritureRepasBoissons,
  ),
  [TiltAdvancedPost.Alimentation]: [
    SubPost.RepasPrisParLesSalaries,
    SubPost.RepasPrisParLesBenevoles,
    SubPost.RepasPrisParLesBeneficiaires,
  ],
  [TiltAdvancedPost.IntrantsServices]: subPostsByPostBC[BCPost.IntrantsServices],
  [TiltAdvancedPost.EquipementsEtImmobilisations]: [
    SubPost.EquipementsDesSalaries,
    SubPost.ParcInformatiqueDesSalaries,
    SubPost.EquipementsDesBenevoles,
    SubPost.ParcInformatiqueDesBenevoles,
  ],
  [TiltAdvancedPost.Utilisation]: [
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
  [TiltAdvancedPost.FinDeVie]: subPostsByPostBC[BCPost.FinDeVie],
  [TiltAdvancedPost.Teletravail]: [SubPost.TeletravailSalaries, SubPost.TeletravailBenevoles],
}

export const subPostsByPostTILTSimplified: Record<TiltSimplifiedPost, SubPost[]> = {
  [TiltSimplifiedPost.LocauxSimplified]: [SubPost.Batiments, SubPost.AutresInfrastructures],
  [TiltSimplifiedPost.EnergiesSimplified]: [
    SubPost.CombustiblesFossiles,
    SubPost.CombustiblesOrganiques,
    SubPost.ReseauxDeChaleurEtDeVapeur,
    SubPost.ReseauxDeFroid,
    SubPost.Electricite,
  ],
  [TiltSimplifiedPost.DechetsSimplified]: [SubPost.DechetsEmisParLOrganisation],
  [TiltSimplifiedPost.FroidEtClimSimplified]: [SubPost.FroidEtClim],
  [TiltSimplifiedPost.DeplacementsDePersonneSimplified]: [
    SubPost.DeplacementsDomicileTravailSalaries,
    SubPost.DeplacementsBenevoles,
    SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
    SubPost.DeplacementsDesBeneficiaires,
    SubPost.DeplacementsFabricationDesVehicules,
  ],
  [TiltSimplifiedPost.TransportDeMarchandisesSimplified]: [SubPost.Fret],
  [TiltSimplifiedPost.IntrantsBiensEtMatieresTiltSimplified]: [SubPost.BienMatieres],
  [TiltSimplifiedPost.AlimentationSimplified]: [
    SubPost.RepasPrisParLesSalaries,
    SubPost.RepasPrisParLesBenevoles,
    SubPost.RepasPrisParLesBeneficiaires,
  ],
  [TiltSimplifiedPost.ServiceEtNumeriqueSimplified]: [SubPost.UsagesNumeriques, SubPost.ServicesEnApprocheMonetaire],

  [TiltSimplifiedPost.EquipementsEtImmobilisationsSimplified]: [
    SubPost.EquipementsDesSalaries,
    SubPost.ParcInformatiqueDesSalaries,
    SubPost.EquipementsDesBenevoles,
    SubPost.ParcInformatiqueDesBenevoles,
  ],
  [TiltSimplifiedPost.UtilisationSimplified]: [SubPost.ConsommationsEnergieUtilisationProduits],
  [TiltSimplifiedPost.FinDeVieSimplified]: [SubPost.FinDeVieProduitsVendusFournisBeneficiaires],
  [TiltSimplifiedPost.TeletravailSimplified]: [SubPost.TeletravailSalariesBenevoles],
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
  ...subPostsByPostTILTSimplified,
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

export const getEnvPosts = (environment: Environment | null | undefined): Post[] =>
  environment ? Object.values(environmentPostMapping[environment]) : []

export const getEnvSubPosts = (environment: Environment | null | undefined): SubPost[] =>
  environment ? Object.values(environmentSubPostsMapping[environment]).flat() : []

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

export const convertSimplifiedEnvToBilanCarbone = (results: BaseResultsByPost[]): { [key: string]: number } => {
  const allPossibleCategories = new Set(Object.values(subPostToBCPostMapping))
  const aggregatedResults: { [key: string]: number } = {}

  allPossibleCategories.forEach((category) => {
    aggregatedResults[category] = 0
  })

  results.forEach((result) => {
    if (result.post === 'total') {
      return
    }

    result.children.forEach((child) => {
      const bilanCarbonePost = subPostToBCPostMapping[child.post as keyof typeof subPostToBCPostMapping]
      if (bilanCarbonePost) {
        aggregatedResults[bilanCarbonePost] = aggregatedResults[bilanCarbonePost] + child.value
      }
    })
  })

  return aggregatedResults
}

export const subPostToBCPostMapping: Partial<Record<SubPost, BCPost>> = {
  // CUT sub-posts
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
  [SubPost.DechetsOrdinaires]: BCPost.DechetsDirects,
  [SubPost.DechetsExceptionnels]: BCPost.DechetsDirects,
  [SubPost.MaterielDistributeurs]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.MaterielCinema]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.CommunicationDigitale]: BCPost.Immobilisations,
  [SubPost.CaissesEtBornes]: BCPost.Immobilisations,

  // Clickson sub-posts
  [SubPost.Electricite]: BCPost.Energies,
  [SubPost.Combustibles]: BCPost.Energies,
  [SubPost.AutresGaz]: BCPost.Energies,
  [SubPost.TypesDeRepasServis]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.DistributeursAutomatiques]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.DechetsOrganiques]: BCPost.DechetsDirects,
  [SubPost.TransportDesEleves]: BCPost.Deplacements,
  [SubPost.TransportDuPersonnel]: BCPost.Deplacements,
  [SubPost.VoyagesScolaires]: BCPost.Deplacements,
  [SubPost.Fournitures]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.ProduitsChimiques]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.EquipementsDeSport]: BCPost.IntrantsBiensEtMatieres,
  [SubPost.DechetsRecyclables]: BCPost.DechetsDirects,
  [SubPost.OrduresMenageresResiduelles]: BCPost.DechetsDirects,
  [SubPost.Construction]: BCPost.Immobilisations,
  [SubPost.Renovation]: BCPost.Immobilisations,
  [SubPost.EquipementsInformatiqueAudiovisuel]: BCPost.Immobilisations,
  [SubPost.EquipementsDivers]: BCPost.Immobilisations,

  // Common sub-posts
  [SubPost.Fret]: BCPost.Fret,
}
