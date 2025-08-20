// Documentation : https://www.bilancarbone-methode.com/4-comptabilisation/4.4-methode-destimation-des-incertitudes/4.4.2-comment-les-determiner

import { FullStudy } from '@/db/study'
import { EmissionFactor, Environment } from '@prisma/client'
import { getEmissionSourcesTotalCo2, sumEmissionSourcesUncertainty } from './emissionSource'
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

export const sumQualities = (qualities: (number | null)[]) =>
  Math.exp(
    Math.sqrt(
      qualities.filter((value) => value !== null).reduce((acc, value) => acc + Math.pow(Math.log(value), 2), 0),
    ),
  )

export const getQualityStandardDeviation = (quality: Quality) => {
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
  return qualities.length > 0 ? sumQualities(qualities) : null
}

export const uncertaintyValues = [1.1199, 1.2621, 1.6361, 2.5164]
export const getStandardDeviationRating = (standardDeviation: number) => {
  if (standardDeviation < uncertaintyValues[0]) {
    return 5
  } else if (standardDeviation < uncertaintyValues[1]) {
    return 4
  } else if (standardDeviation < uncertaintyValues[2]) {
    return 3
  } else if (standardDeviation < uncertaintyValues[3]) {
    return 2
  } else {
    return 1
  }
}

export const getQualityRating = (quality: Quality) => {
  const standardDeviation = getQualityStandardDeviation(quality)
  if (!standardDeviation) {
    return null
  }
  return getStandardDeviationRating(standardDeviation)
}

export const getEmissionSourcesGlobalUncertainty = (
  emissionSources: FullStudy['emissionSources'],
  environment?: Environment,
) => {
  const totalEmissions = getEmissionSourcesTotalCo2(emissionSources, environment)
  const gsd = sumEmissionSourcesUncertainty(emissionSources, environment)
  return getConfidenceInterval(totalEmissions, gsd)
}

export const getConfidenceInterval = (emission: number, standardDeviation: number) => [
  emission / standardDeviation,
  emission * standardDeviation,
]
