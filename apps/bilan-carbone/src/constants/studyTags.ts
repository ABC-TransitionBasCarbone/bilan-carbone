import { Environment, SubPost } from '@prisma/client'

export enum DefaultStudyTagNames {
  PERIMETRE_INTERNE = 'Périmètre Interne',
  PERIMETRE_BENEVOLES = 'Périmètre Bénévoles',
  PERIMETRE_BENEFICIAIRES = 'Périmètre Bénéficiaires',
  NUMERIQUE = 'Numérique',
}

type DefaultStudyTags = {
  [key in Environment]?: {
    name: string
    color: string
  }[]
}

export enum StudyTagColors {
  DEFAULT = '#ffffff',
  GREEN = '#94EBBF',
  RED = '#e04949',
  ORANGE = '#fc8514',
  BLUE = '#606af5',
}

export const DefaultStudyTags: DefaultStudyTags = {
  [Environment.TILT]: [
    { name: DefaultStudyTagNames.PERIMETRE_INTERNE, color: StudyTagColors.GREEN },
    { name: DefaultStudyTagNames.PERIMETRE_BENEVOLES, color: StudyTagColors.RED },
    { name: DefaultStudyTagNames.PERIMETRE_BENEFICIAIRES, color: StudyTagColors.ORANGE },
    { name: DefaultStudyTagNames.NUMERIQUE, color: StudyTagColors.BLUE },
  ],
}
type DefaultStudyTagMap = {
  [key in Environment]?: {
    [key in DefaultStudyTagNames]?: SubPost[]
  }
}

export const DefaultStudyTagMap: DefaultStudyTagMap = {
  [Environment.TILT]: {
    [DefaultStudyTagNames.PERIMETRE_INTERNE]: [
      SubPost.Batiment,
      SubPost.AutresInfrastructures,
      SubPost.CombustiblesFossiles,
      SubPost.CombustiblesOrganiques,
      SubPost.ReseauxDeChaleurEtDeVapeur,
      SubPost.ReseauxDeFroid,
      SubPost.Electricite,

      SubPost.DechetsDEmballagesEtPlastiques,
      SubPost.DechetsOrganiques,
      SubPost.DechetsOrduresMenageres,
      SubPost.DechetsDangereux,
      SubPost.DechetsBatiments,
      SubPost.FuitesOuEmissionsNonEnergetiques,
      SubPost.EauxUsees,
      SubPost.AutresDechets,

      SubPost.ActivitesAgricoles,
      SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas,
      SubPost.ActivitesIndustrielles,

      SubPost.DeplacementsDomicileTravailSalaries,
      SubPost.DeplacementsDansLeCadreDUneMissionAssociativeSalaries,
      SubPost.DeplacementsFabricationDesVehicules,

      SubPost.Entrant,
      SubPost.Interne,
      SubPost.Sortant,
      SubPost.TransportFabricationDesVehicules,

      SubPost.MetauxPlastiquesEtVerre,
      SubPost.PapiersCartons,
      SubPost.MateriauxDeConstruction,
      SubPost.ProduitsChimiquesEtHydrogene,
      SubPost.MatiereDestineeAuxEmballages,
      SubPost.AutresIntrants,
      SubPost.BiensEtMatieresEnApprocheMonetaire,

      SubPost.RepasPrisParLesSalaries,

      SubPost.AchatsDeServices,
      SubPost.UsagesNumeriques,
      SubPost.ServicesEnApprocheMonetaire,

      SubPost.EquipementsDesSalaries,
      SubPost.ParcInformatiqueDesSalaries,

      SubPost.InvestissementsFinanciersRealises,

      SubPost.TeletravailSalaries,

      SubPost.FroidEtClim,
    ],
    [DefaultStudyTagNames.PERIMETRE_BENEVOLES]: [
      SubPost.DeplacementsDomicileTravailBenevoles,
      SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles,
      SubPost.RepasPrisParLesBenevoles,
      SubPost.TeletravailBenevoles,

      SubPost.EquipementsDesBenevoles,
      SubPost.ParcInformatiqueDesBenevoles,
    ],
    [DefaultStudyTagNames.PERIMETRE_BENEFICIAIRES]: [
      SubPost.DeplacementsDesBeneficiaires,
      SubPost.RepasPrisParLesBeneficiaires,
      SubPost.UtilisationEnResponsabiliteConsommationDeBiens,
      SubPost.UtilisationEnResponsabiliteConsommationNumerique,
      SubPost.UtilisationEnResponsabiliteConsommationDEnergie,
      SubPost.UtilisationEnResponsabiliteFuitesEtAutresConsommations,
      SubPost.UtilisationEnDependanceConsommationDeBiens,
      SubPost.UtilisationEnDependanceConsommationNumerique,
      SubPost.UtilisationEnDependanceConsommationDEnergie,
      SubPost.UtilisationEnDependanceFuitesEtAutresConsommations,

      SubPost.ConsommationDEnergieEnFinDeVie,
      SubPost.TraitementDesDechetsEnFinDeVie,
      SubPost.FuitesOuEmissionsNonEnergetiques,
      SubPost.TraitementDesEmballagesEnFinDeVie,
    ],
    [DefaultStudyTagNames.NUMERIQUE]: [
      SubPost.UtilisationEnResponsabiliteConsommationNumerique,
      SubPost.UtilisationEnDependanceConsommationNumerique,
    ],
  },
}
