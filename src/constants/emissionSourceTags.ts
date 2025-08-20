import { Environment, SubPost } from '@prisma/client'

export enum DefaultEmissionSourceTag {
  PERIMETRE_INTERNE = 'Périmètre Interne',
  PERIMETRE_BENEVOLES = 'Périmètre Bénévoles',
  PERIMETRE_BENEFICIAIRES = 'Périmètre Bénéficiaires',
  NUMERIQUE = 'Numérique',
}

type DefaultEmissionSourceTags = {
  [key in Environment]?: {
    name: string
    color: string
  }[]
}

export enum emissionSourceTagColors {
  DEFAULT = '#ffffff',
  GREEN = '#94EBBF',
  RED = '#e04949',
  ORANGE = '#fc8514',
  BLUE = '#606af5',
}

export const defaultEmissionSourceTags: DefaultEmissionSourceTags = {
  [Environment.TILT]: [
    { name: DefaultEmissionSourceTag.PERIMETRE_INTERNE, color: emissionSourceTagColors.GREEN },
    { name: DefaultEmissionSourceTag.PERIMETRE_BENEVOLES, color: emissionSourceTagColors.RED },
    { name: DefaultEmissionSourceTag.PERIMETRE_BENEFICIAIRES, color: emissionSourceTagColors.ORANGE },
    { name: DefaultEmissionSourceTag.NUMERIQUE, color: emissionSourceTagColors.BLUE },
  ],
}
type EmissionSourceTagMap = {
  [key in Environment]?: {
    [key in DefaultEmissionSourceTag]?: SubPost[]
  }
}

export const emissionSourceTagMap: EmissionSourceTagMap = {
  [Environment.TILT]: {
    [DefaultEmissionSourceTag.PERIMETRE_INTERNE]: [
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
      SubPost.EquipementsDesBenevoles,
      SubPost.ParcInformatiqueDesBenevoles,

      SubPost.InvestissementsFinanciersRealises,

      SubPost.TeletravailSalaries,

      SubPost.FroidEtClim,
    ],
    [DefaultEmissionSourceTag.PERIMETRE_BENEVOLES]: [
      SubPost.DeplacementsDomicileTravailBenevoles,
      SubPost.DeplacementsDansLeCadreDUneMissionAssociativeBenevoles,
      SubPost.RepasPrisParLesBenevoles,
      SubPost.TeletravailBenevoles,
    ],
    [DefaultEmissionSourceTag.PERIMETRE_BENEFICIAIRES]: [
      SubPost.DeplacementsDesBeneficiaires,
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
    [DefaultEmissionSourceTag.NUMERIQUE]: [
      SubPost.UtilisationEnResponsabiliteConsommationNumerique,
      SubPost.UtilisationEnDependanceConsommationNumerique,
    ],
  },
}
