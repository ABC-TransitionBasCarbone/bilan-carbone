import { Emission } from '@prisma/client'

const coeffs: Partial<Record<keyof Emission, number[]>> = {
  reliability: [1.5, 1.2, 1.1, 1.05, 1],
  technicalRepresentativeness: [2, 1.5, 1.2, 1.1, 1],
  geographicRepresentativeness: [1.1, 1.05, 1.02, 1.01, 1],
  temporalRepresentativeness: [1.5, 1.2, 1.1, 1.03, 1],
  completeness: [1.2, 1.1, 1.05, 1.02, 1],
}

export const getEmissionStandardDeviation = (emission: Emission) => {
  const qualities = Object.entries(coeffs)
    .map(([key, value]) => {
      const quality = Number(emission[key as keyof Emission])
      if (!quality || Number.isNaN(quality)) {
        return undefined
      }
      return value[quality - 1]
    })
    .filter((value) => value !== undefined)
  return Math.exp(Math.sqrt(qualities.reduce((acc, value) => acc + Math.pow(Math.log(value), 2), 0)))
}

export const getRating = (standardDeviation: number) => {
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
