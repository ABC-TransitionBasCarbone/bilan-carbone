import { Emission } from '@prisma/client'

type Quality = Pick<
  Emission,
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
  return qualities.length > 0
    ? Math.exp(Math.sqrt(qualities.reduce((acc, value) => acc + Math.pow(Math.log(value), 2), 0)))
    : null
}

export const getQualityRating = (quality: Quality) => {
  const standardDeviation = getQualityStandardDeviation(quality)
  if (!standardDeviation) {
    return null
  }

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
