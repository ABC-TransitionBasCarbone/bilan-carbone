import { FullStudy } from '@/db/study'
import { getQualityStandardDeviation } from './uncertainty'

const getConfidenceInterval = (emissionSource: FullStudy['emissionSources'][0], emission: number | null) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emissionStandardDeviation = getQualityStandardDeviation(emissionSource)
  const factorStandardDeviation = getQualityStandardDeviation(emissionSource.emissionFactor)
  if (emission === null || emissionStandardDeviation === null || factorStandardDeviation === null) {
    return null
  }

  const standardDeviation = Math.exp(
    2 * Math.sqrt(Math.pow(Math.log(factorStandardDeviation), 2) * Math.pow(Math.log(emissionStandardDeviation), 2)),
  )
  return [emission / standardDeviation, emission * standardDeviation]
}

const getAlpha = (emission: number | null, confidenceInterval: number[] | null) => {
  if (emission === null || confidenceInterval === null || confidenceInterval[1] === undefined) {
    return null
  }

  return (confidenceInterval[1] - emission) / emission
}

export const getEmissionResults = (emissionSource: FullStudy['emissionSources'][0]) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emission = emissionSource.emissionFactor.totalCo2 * emissionSource.value
  const confidenceInterval = getConfidenceInterval(emissionSource, emission)
  const alpha = getAlpha(emission, confidenceInterval)
  return {
    emission,
    confidenceInterval,
    alpha,
  }
}
