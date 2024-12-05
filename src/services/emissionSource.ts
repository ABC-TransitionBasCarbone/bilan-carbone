import { FullStudy } from '@/db/study'
import { EmissionSourceCaracterisation, SubPost } from '@prisma/client'
import { StudyWithoutDetail } from './permissions/study'
import { getConfidenceInterval, getQualityStandardDeviation } from './uncertainty'

export const getStandardDeviation = (emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0]) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emissionStandardDeviation = getQualityStandardDeviation(emissionSource)
  const factorStandardDeviation = getQualityStandardDeviation(emissionSource.emissionFactor)
  if (emissionStandardDeviation === null || factorStandardDeviation === null) {
    return null
  }

  return Math.exp(
    2 *
      Math.sqrt(
        Math.pow(Math.log(Math.sqrt(factorStandardDeviation)), 2) +
          Math.pow(Math.log(Math.sqrt(emissionStandardDeviation)), 2),
      ),
  )
}

const getAlpha = (emission: number | null, confidenceInterval: number[] | null) => {
  if (emission === null || confidenceInterval === null || confidenceInterval[1] === undefined) {
    return null
  }

  return (confidenceInterval[1] - emission) / emission
}

export const getEmissionResults = (emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0]) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emission = emissionSource.emissionFactor.totalCo2 * emissionSource.value
  const standardDeviation = getStandardDeviation(emissionSource)
  const confidenceInterval = standardDeviation ? getConfidenceInterval(emission, standardDeviation) : null
  const alpha = getAlpha(emission, confidenceInterval)

  return {
    emission,
    standardDeviation,
    confidenceInterval,
    alpha,
  }
}

export const sumStandardDeviations = (standardDeviations: { value: number; standardDeviation: number | null }[]) => {
  const total = standardDeviations.reduce((acc, { value }) => acc + value, 0)
  return Math.pow(
    Math.exp(
      Math.sqrt(
        standardDeviations.reduce(
          (acc, { value, standardDeviation }) =>
            acc + Math.pow(value / total, 2) * Math.pow(Math.log(standardDeviation || 1), 2),
          0,
        ),
      ),
    ),
    2,
  )
}

export const sumEmissionSourcesUncertainty = (emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources']) => {
  const results = emissionSource
    .map(getEmissionResults)
    .filter((result) => result !== null)
    .map((result) => ({
      value: result.emission,
      standardDeviation: result.standardDeviation,
    }))

  return sumStandardDeviations(results)
}

export const getEmissionSourcesTotalCo2 = (emissionSources: FullStudy['emissionSources']) =>
  emissionSources.reduce(
    (sum, emissionSource) => sum + (emissionSource.value || 0) * (emissionSource.emissionFactor?.totalCo2 || 0),
    0,
  )

export const caracterisationsBySubPost: Record<SubPost, EmissionSourceCaracterisation[]> = {
  [SubPost.CombustiblesFossiles]: [EmissionSourceCaracterisation.Operated, EmissionSourceCaracterisation.NotOperated],
  [SubPost.CombustiblesOrganiques]: [EmissionSourceCaracterisation.Operated, EmissionSourceCaracterisation.NotOperated],
  [SubPost.ReseauxDeChaleurEtDeVapeur]: [
    EmissionSourceCaracterisation.Operated,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.ReseauxDeFroid]: [EmissionSourceCaracterisation.Operated, EmissionSourceCaracterisation.NotOperated],
  [SubPost.Electricite]: [EmissionSourceCaracterisation.Operated, EmissionSourceCaracterisation.NotOperated],
  [SubPost.Agriculture]: [
    EmissionSourceCaracterisation.OperatedProcedeed,
    EmissionSourceCaracterisation.OperatedFugitive,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas]: [
    EmissionSourceCaracterisation.OperatedProcedeed,
    EmissionSourceCaracterisation.OperatedFugitive,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.EmissionsLieesALaProductionDeFroid]: [
    EmissionSourceCaracterisation.OperatedProcedeed,
    EmissionSourceCaracterisation.OperatedFugitive,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.EmissionsLieesAuxProcedesIndustriels]: [
    EmissionSourceCaracterisation.OperatedProcedeed,
    EmissionSourceCaracterisation.OperatedFugitive,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.AutresEmissionsNonEnergetiques]: [
    EmissionSourceCaracterisation.OperatedProcedeed,
    EmissionSourceCaracterisation.OperatedFugitive,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.MetauxPlastiquesEtVerre]: [EmissionSourceCaracterisation.Operated],
  [SubPost.PapiersCartons]: [EmissionSourceCaracterisation.Operated],
  [SubPost.MateriauxDeConstruction]: [EmissionSourceCaracterisation.Operated],
  [SubPost.ProduitsChimiquesEtHydrogene]: [EmissionSourceCaracterisation.Operated],
  [SubPost.NourritureRepasBoissons]: [EmissionSourceCaracterisation.Operated],
  [SubPost.MatiereDestineeAuxEmballages]: [EmissionSourceCaracterisation.Operated],
  [SubPost.AutresIntrants]: [EmissionSourceCaracterisation.Operated],
  [SubPost.BiensEtMatieresEnApprocheMonetaire]: [EmissionSourceCaracterisation.Operated],
  [SubPost.AchatsDeServices]: [EmissionSourceCaracterisation.Operated],
  [SubPost.UsagesNumeriques]: [EmissionSourceCaracterisation.Operated],
  [SubPost.ServicesEnApprocheMonetaire]: [EmissionSourceCaracterisation.Operated],
  [SubPost.DechetsDEmballagesEtPlastiques]: [EmissionSourceCaracterisation.Operated],
  [SubPost.DechetsOrganiques]: [EmissionSourceCaracterisation.Operated],
  [SubPost.DechetsOrduresMenageres]: [EmissionSourceCaracterisation.Operated],
  [SubPost.DechetsDangereux]: [EmissionSourceCaracterisation.Operated],
  [SubPost.DechetsBatiments]: [EmissionSourceCaracterisation.Operated],
  [SubPost.DechetsFuitesOuEmissionsNonEnergetiques]: [EmissionSourceCaracterisation.Operated],
  [SubPost.EauxUsees]: [EmissionSourceCaracterisation.Operated],
  [SubPost.FretEntrant]: [
    EmissionSourceCaracterisation.Operated,
    EmissionSourceCaracterisation.NotOperatedSupported,
    EmissionSourceCaracterisation.NotOperatedNotSupported,
  ],
  [SubPost.FretInterne]: [
    EmissionSourceCaracterisation.Operated,
    EmissionSourceCaracterisation.NotOperatedSupported,
    EmissionSourceCaracterisation.NotOperatedNotSupported,
  ],
  [SubPost.FretSortant]: [
    EmissionSourceCaracterisation.Operated,
    EmissionSourceCaracterisation.NotOperatedSupported,
    EmissionSourceCaracterisation.NotOperatedNotSupported,
  ],
  [SubPost.DeplacementsDomicileTravail]: [
    EmissionSourceCaracterisation.Operated,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.DeplacementsDesEmployesDansLeCadreDuTravail]: [
    EmissionSourceCaracterisation.Operated,
    EmissionSourceCaracterisation.NotOperated,
  ],
  [SubPost.DeplacementsVisiteurs]: [EmissionSourceCaracterisation.Operated, EmissionSourceCaracterisation.NotOperated],
  [SubPost.Batiments]: [EmissionSourceCaracterisation.Operated],
  [SubPost.AutresInfrastructures]: [EmissionSourceCaracterisation.Operated],
  [SubPost.Equipements]: [EmissionSourceCaracterisation.Operated],
  [SubPost.Informatique]: [EmissionSourceCaracterisation.Operated],
  [SubPost.UtilisationEnResponsabilite]: [
    EmissionSourceCaracterisation.Rented,
    EmissionSourceCaracterisation.FinalClient,
  ],
  [SubPost.UtilisationEnDependance]: [],
  [SubPost.InvestissementsFinanciersRealises]: [EmissionSourceCaracterisation.Operated],
  [SubPost.ConsommationDEnergieEnFinDeVie]: [
    EmissionSourceCaracterisation.Rented,
    EmissionSourceCaracterisation.FinalClient,
  ],
  [SubPost.TraitementDesDechetsEnFinDeVie]: [
    EmissionSourceCaracterisation.Rented,
    EmissionSourceCaracterisation.FinalClient,
  ],
  [SubPost.FuitesOuEmissionsNonEnergetiques]: [
    EmissionSourceCaracterisation.Rented,
    EmissionSourceCaracterisation.FinalClient,
  ],
  [SubPost.TraitementDesEmballagesEnFinDeVie]: [
    EmissionSourceCaracterisation.Rented,
    EmissionSourceCaracterisation.FinalClient,
  ],
}
