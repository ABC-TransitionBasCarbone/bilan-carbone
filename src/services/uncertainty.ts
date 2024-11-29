// Documentation : https://www.bilancarbone-methode.com/4-comptabilisation/4.4-methode-destimation-des-incertitudes/4.4.2-comment-les-determiner

import { FullStudy } from '@/db/study'
import { EmissionFactor } from '@prisma/client'
import { getEmissionSourcesTotalCo2, sumEmissionSourcesResults } from './emissionSource'

type Quality = Pick<
  EmissionFactor,
  | 'reliability'
  | 'technicalRepresentativeness'
  | 'geographicRepresentativeness'
  | 'temporalRepresentativeness'
  | 'completeness'
>

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

export const getStandardDeviationRating = (standardDeviation: number) => {
  if (standardDeviation < 1.1199) {
    return 5
  } else if (standardDeviation < 1.2621) {
    return 4
  } else if (standardDeviation < 1.6361) {
    return 3
  } else if (standardDeviation < 2.5164) {
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

export const getEmissionSourcesGlobalUncertainty = (emissionSources: FullStudy['emissionSources']) => {
  const totalEmissions = getEmissionSourcesTotalCo2(emissionSources)
  const gsd = sumEmissionSourcesResults(emissionSources)
  return getConfidenceInterval(totalEmissions, gsd)
}

export const getConfidenceInterval = (emission: number, standardDeviation: number) => [
  emission / standardDeviation,
  emission * standardDeviation,
]
