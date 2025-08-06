import { FullStudy } from '@/db/study'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { EmissionSourceCaracterisation, Environment, StudyEmissionSource, SubPost } from '@prisma/client'
import { StudyWithoutDetail } from './permissions/study'
import { convertTiltSubPostToBCSubPost, Post, subPostsByPost } from './posts'
import { getConfidenceInterval, getQualityStandardDeviation, getSpecificEmissionFactorQuality } from './uncertainty'

export const getEmissionSourceCompletion = (
  emissionSource: Pick<
    StudyEmissionSource,
    | 'name'
    | 'type'
    | 'value'
    | 'emissionFactorId'
    | 'caracterisation'
    | 'subPost'
    | 'depreciationPeriod'
    | 'hectare'
    | 'duration'
  >,
  study: FullStudy | StudyWithoutDetail,
  emissionFactor: (FullStudy | StudyWithoutDetail)['emissionSources'][0]['emissionFactor'],
) => {
  const mandatoryFields = ['name', 'type', 'value', 'emissionFactorId'] as (keyof typeof emissionSource)[]
  const caracterisations = caracterisationsBySubPost[emissionSource.subPost]
  if (study.exports.length > 0 && caracterisations && caracterisations.length > 0) {
    mandatoryFields.push('caracterisation')
  }
  if (subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost)) {
    mandatoryFields.push('depreciationPeriod')
  }

  if (
    emissionSource.subPost === SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas &&
    emissionFactor &&
    emissionFactor.unit === 'HA_YEAR'
  ) {
    mandatoryFields.push('hectare')
    mandatoryFields.push('duration')
  }

  return mandatoryFields.reduce((acc, field) => acc + (emissionSource[field] ? 1 : 0), 0) / mandatoryFields.length
}

export const canBeValidated = (
  emissionSource: Pick<
    StudyEmissionSource,
    | 'name'
    | 'type'
    | 'value'
    | 'emissionFactorId'
    | 'caracterisation'
    | 'subPost'
    | 'depreciationPeriod'
    | 'hectare'
    | 'duration'
  >,
  study: FullStudy | StudyWithoutDetail,
  emissionFactor: (FullStudy | StudyWithoutDetail)['emissionSources'][0]['emissionFactor'],
) => {
  return getEmissionSourceCompletion(emissionSource, study, emissionFactor) === 1
}

export const getStandardDeviation = (emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0]) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emissionStandardDeviation = getQualityStandardDeviation(emissionSource)
  const factorStandardDeviation = getQualityStandardDeviation(getSpecificEmissionFactorQuality(emissionSource))
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

const getEmissionSourceEmission = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
  environment?: Environment,
) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }

  let emission = getEmissionFactorValue(emissionSource.emissionFactor, environment) * emissionSource.value
  if (
    [...subPostsByPost[Post.Immobilisations], SubPost.Electromenager, SubPost.Batiment].includes(
      emissionSource.subPost,
    ) &&
    emissionSource.depreciationPeriod
  ) {
    emission = emission / emissionSource.depreciationPeriod
  }

  return emission
}

const getEmissionSourceMonetaryEmission = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
  environment?: Environment,
) => {
  if (!emissionSource.emissionFactor || !emissionSource.emissionFactor.isMonetary) {
    return null
  }
  return getEmissionSourceEmission(emissionSource, environment)
}

export const getEmissionResults = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
  environment?: Environment,
) => {
  const emission = getEmissionSourceEmission(emissionSource, environment)
  if (emission === null) {
    return null
  }

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
  const totalValue = standardDeviations.reduce((acc, { value }) => acc + value, 0)

  return Math.exp(
    Math.sqrt(
      standardDeviations.reduce((acc, { value, standardDeviation }) => {
        const sensibility = value / totalValue
        const sd = Math.log(standardDeviation || 1)
        return acc + sensibility * sensibility * sd * sd
      }, 0),
    ),
  )
}

export const sumEmissionSourcesUncertainty = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'],
  environment?: Environment,
) => {
  const results = emissionSource
    .map((source) => getEmissionResults(source, environment))
    .filter((result) => result !== null)
    .map((result) => ({
      value: result.emission,
      standardDeviation: result.standardDeviation,
    }))

  return sumStandardDeviations(results)
}

export const getEmissionSourcesTotalCo2 = (
  emissionSources: FullStudy['emissionSources'],
  environment: Environment | undefined,
) =>
  emissionSources.reduce(
    (sum, emissionSource) => sum + (getEmissionSourceEmission(emissionSource, environment) || 0),
    0,
  )

export const getEmissionSourcesTotalMonetaryCo2 = (
  emissionSources: FullStudy['emissionSources'],
  environment?: Environment,
) =>
  emissionSources.reduce(
    (sum, emissionSource) => sum + (getEmissionSourceMonetaryEmission(emissionSource, environment) || 0),
    0,
  )

export const getEmissionResultsCut = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
  environment?: Environment,
) => {
  const result = getEmissionResults(emissionSource, environment)
  if (result?.emission && emissionSource.depreciationPeriod && emissionSource.depreciationPeriod < 5) {
    result.emission = result.emission / 5
  }
  return result
}

export const caracterisationsBySubPost: Partial<Record<SubPost, EmissionSourceCaracterisation[]>> = {
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
  [SubPost.AutresDechets]: [EmissionSourceCaracterisation.Operated],
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
  [SubPost.DeplacementsProfessionnels]: [
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

export const getCaracterisationBySubPostWithEnv = (subPost: SubPost, environment?: Environment) => {
  if (environment === Environment.TILT) {
    const bcSubpost = convertTiltSubPostToBCSubPost(subPost)
    return caracterisationsBySubPost[bcSubpost] || []
  }
  return caracterisationsBySubPost[subPost] || []
}
