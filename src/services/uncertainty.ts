// Documentation : https://www.bilancarbone-methode.com/4-comptabilisation/4.4-methode-destimation-des-incertitudes/4.4.2-comment-les-determiner

import { FullStudy } from '@/db/study'
import { EmissionFactor } from '@prisma/client'
import { getEmissionSourcesTotalCo2 } from './emissionSource'
import { StudyWithoutDetail } from './permissions/study'

export const qualityKeys = [
  'reliability',
  'technicalRepresentativeness',
  'geographicRepresentativeness',
  'temporalRepresentativeness',
  'completeness',
] as const

export const specificFEQualityKeys = [
  'feReliability',
  'feTechnicalRepresentativeness',
  'feGeographicRepresentativeness',
  'feTemporalRepresentativeness',
  'feCompleteness',
] as const

export const specificFEQualityKeysLinks: Record<(typeof qualityKeys)[number], (typeof specificFEQualityKeys)[number]> =
  {
    reliability: 'feReliability',
    technicalRepresentativeness: 'feTechnicalRepresentativeness',
    geographicRepresentativeness: 'feGeographicRepresentativeness',
    temporalRepresentativeness: 'feTemporalRepresentativeness',
    completeness: 'feCompleteness',
  }

const getQualityValue = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
  column: (typeof qualityKeys)[number],
) =>
  emissionSource[specificFEQualityKeysLinks[column]]
    ? emissionSource[specificFEQualityKeysLinks[column]]
    : emissionSource.emissionFactor
      ? emissionSource.emissionFactor[column]
      : null

export const getSpecificEmissionFactorQuality = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
) =>
  qualityKeys.reduce(
    (res, column) => ({ ...res, [column]: getQualityValue(emissionSource, column) }),
    {} as Record<(typeof qualityKeys)[number], number>,
  )

type Quality = Pick<EmissionFactor, (typeof qualityKeys)[number]>

const coeffs: Record<keyof Quality, number[]> = {
  reliability: [1.5, 1.2, 1.1, 1.05, 1],
  technicalRepresentativeness: [2, 1.5, 1.2, 1.1, 1],
  geographicRepresentativeness: [1.1, 1.05, 1.02, 1.01, 1],
  temporalRepresentativeness: [1.5, 1.2, 1.1, 1.03, 1],
  completeness: [1.2, 1.1, 1.05, 1.02, 1],
}

export const getSquaredStandardDeviationForQuality = (quality: Quality) => {
  const qualities = Object.entries(coeffs)
    .map(([key, values]) => {
      const value = Number(quality[key as keyof Quality])
      if (!value || Number.isNaN(value)) {
        return undefined
      }
      // -1 because the values are 0-indexed
      return values[value - 1]
    })
    .filter((value) => value !== undefined)

  if (qualities.length === 0) {
    return null
  }

  return Math.exp(
    Math.sqrt(
      qualities.filter((value) => value !== null).reduce((acc, value) => acc + Math.pow(Math.log(value), 2), 0),
    ),
  )
}

export const getSquaredStandardDeviationForEmissionSource = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][number],
) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emissionSquaredStandardDeviation = getSquaredStandardDeviationForQuality(emissionSource)
  const factorSquaredStandardDeviation = getSquaredStandardDeviationForQuality(
    getSpecificEmissionFactorQuality(emissionSource),
  )
  if (emissionSquaredStandardDeviation === null || factorSquaredStandardDeviation === null) {
    return null
  }

  return Math.exp(
    2 *
      Math.sqrt(
        Math.pow(Math.log(Math.sqrt(factorSquaredStandardDeviation)), 2) +
          Math.pow(Math.log(Math.sqrt(emissionSquaredStandardDeviation)), 2),
      ),
  )
}

export const getSquaredStandardDeviationForEmissionSourceArray = (
  emissionSources: { value: number | null; squaredStandardDeviation?: number | null }[],
) => {
  const total = emissionSources.reduce((acc, es) => (es.value ? acc + es.value : acc), 0)

  return Math.exp(
    Math.sqrt(
      emissionSources.reduce((acc, es) => {
        if (!es.value) {
          return acc
        }

        return acc + Math.pow(es.value / total, 2) * Math.pow(Math.log(Math.sqrt(es.squaredStandardDeviation || 1)), 2)
      }, 0),
    ),
  )
}

export const uncertaintyValues = [1.1199, 1.2621, 1.6361, 2.5164]
export const getQualitativeUncertaintyFromSquaredStandardDeviation = (squaredStandardDeviation: number) => {
  if (squaredStandardDeviation < uncertaintyValues[0]) {
    return 5
  } else if (squaredStandardDeviation < uncertaintyValues[1]) {
    return 4
  } else if (squaredStandardDeviation < uncertaintyValues[2]) {
    return 3
  } else if (squaredStandardDeviation < uncertaintyValues[3]) {
    return 2
  }

  return 1
}

export const getQualitativeUncertaintyFromQuality = (quality: Quality) => {
  const squaredStandardDeviation = getSquaredStandardDeviationForQuality(quality)
  if (!squaredStandardDeviation) {
    return null
  }
  return getQualitativeUncertaintyFromSquaredStandardDeviation(squaredStandardDeviation)
}

export const getEmissionSourcesConfidenceInterval = (
  emissionSources: (Pick<FullStudy['emissionSources'][number], 'emissionFactor'> & {
    emissionValue: number
    standardDeviation: number | null
  })[],
) => {
  const totalEmissions = getEmissionSourcesTotalCo2(emissionSources)
  const gsd = getSquaredStandardDeviationForEmissionSourceArray(
    emissionSources.map((es) => ({
      value: es.emissionValue,
      squaredStandardDeviation: es.standardDeviation,
    })),
  )
  return getConfidenceInterval(totalEmissions, gsd)
}

export const getConfidenceInterval = (emission: number, squaredStandardDeviation: number) => [
  emission / squaredStandardDeviation,
  emission * squaredStandardDeviation,
]

export const getQualitativeUncertaintyForEmissionSources = (
  emissionSources: { value: number | null; squaredStandardDeviation?: number | null }[],
) =>
  getQualitativeUncertaintyFromSquaredStandardDeviation(
    getSquaredStandardDeviationForEmissionSourceArray(emissionSources),
  )
