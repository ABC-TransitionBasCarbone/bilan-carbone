import { wasteImpact } from '@/constants/emissions'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { hasWasteImpact } from '@/services/permissions/environment'
import { Post, subPostsByPostBC } from '@/services/posts'
import { EmissionFactor, Environment, Import, Prisma, SubPost, Unit } from '@prisma/client'
import { unique } from './array'

export const getEmissionFactorValue = (
  emissionFactor: Pick<EmissionFactor, 'importedFrom' | 'importedId' | 'totalCo2'>,
  environment?: Environment,
) => {
  if (
    (!environment || hasWasteImpact(environment)) &&
    emissionFactor.importedFrom === Import.BaseEmpreinte &&
    emissionFactor.importedId &&
    wasteEmissionFactors[emissionFactor.importedId]
  ) {
    return wasteImpact
  }

  return emissionFactor.totalCo2
}

export const emissionFactorDefautQualityStar = '☆'

export const ManualEmissionFactorUnitList: Unit[] = [
  Unit.PERCENT,
  Unit.GJ_PCI,
  Unit.GJ_PCS,
  Unit.GO,
  Unit.GWH,
  Unit.HA,
  Unit.HA_YEAR,
  Unit.HOUR,
  Unit.DAY,
  Unit.KG,
  Unit.KM,
  Unit.KWH,
  Unit.KWH_PCI,
  Unit.KWH_PCS,
  Unit.LITER,
  Unit.METER,
  Unit.M2,
  Unit.M3,
  Unit.PASSENGER_KM,
  Unit.TEP_PCI,
  Unit.TEP_PCS,
  Unit.TON,
  Unit.UNIT,
  Unit.VEHICLE_KM,
  Unit.EURO,
  Unit.DOLLAR,
  Unit.JPY,
  Unit.CNY,
  Unit.YEAR,
  Unit.CUSTOM,
]

export const isMonetaryEmissionFactor = (
  emissionFactor: Partial<Pick<Prisma.EmissionFactorCreateInput, 'unit' | 'customUnit' | 'isMonetary'>>,
) => (emissionFactor.customUnit && emissionFactor.isMonetary) || monetaryUnits.includes(emissionFactor.unit as Unit)

export const monetaryUnits: Unit[] = [
  Unit.DOLLAR,
  Unit.EURO,
  Unit.CNY,
  Unit.JPY,
  Unit.KEURO,
  Unit.KEURO_2019_HT,
  Unit.KEURO_2020_HT,
  Unit.KEURO_2021_HT,
  Unit.KEURO_2022_HT,
  Unit.KEURO_2023_HT,
  Unit.EURO_SPENT,
  Unit.FRANC_CFP,
]

const tiltEmissionFactorSubPostsMapping: Partial<Record<SubPost, SubPost[]>> = {
  [SubPost.UtilisationEnResponsabiliteConsommationDeBiens]: subPostsByPostBC[Post.IntrantsBiensEtMatieres],
  [SubPost.UtilisationEnDependanceConsommationDeBiens]: subPostsByPostBC[Post.IntrantsBiensEtMatieres],
  [SubPost.UtilisationEnResponsabiliteConsommationDEnergie]: subPostsByPostBC[Post.Energies],
  [SubPost.UtilisationEnDependanceConsommationDEnergie]: subPostsByPostBC[Post.Energies],
  [SubPost.UtilisationEnDependanceFuitesEtAutresConsommations]: [
    ...(subPostsByPostBC[Post.AutresEmissionsNonEnergetiques] || []),
    SubPost.FroidEtClim,
    SubPost.EmissionsLieesALaProductionDeFroid,
  ],
  [SubPost.UtilisationEnResponsabiliteFuitesEtAutresConsommations]: [
    ...(subPostsByPostBC[Post.AutresEmissionsNonEnergetiques] || []),
    SubPost.FroidEtClim,
    SubPost.EmissionsLieesALaProductionDeFroid,
  ],
  [SubPost.UtilisationEnResponsabiliteConsommationNumerique]: [SubPost.Informatique, SubPost.UsagesNumeriques],
  [SubPost.UtilisationEnDependanceConsommationNumerique]: [SubPost.Informatique, SubPost.UsagesNumeriques],
  [SubPost.FroidEtClim]: [SubPost.EmissionsLieesALaProductionDeFroid],
}

const getEmissionFactorSubPostMap = (subPost: SubPost, env: Environment): SubPost[] => {
  switch (env) {
    case Environment.TILT:
      return [subPost, ...(tiltEmissionFactorSubPostsMapping[subPost] || [])]
    default:
      return [subPost]
  }
}

export const getEmissionFactorSubPostsMap = (subPosts: SubPost[], env: Environment) =>
  unique(subPosts.reduce((res, subPost) => res.concat(getEmissionFactorSubPostMap(subPost, env)), [] as SubPost[]))
