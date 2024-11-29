import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from './permissions/study'
import { getConfidenceInterval, getQualityStandardDeviation } from './uncertainty'

const getStandardDeviation = (
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
  emission: number | null,
) => {
  if (!emissionSource.emissionFactor || emissionSource.value === null) {
    return null
  }
  const emissionStandardDeviation = getQualityStandardDeviation(emissionSource)
  const factorStandardDeviation = getQualityStandardDeviation(emissionSource.emissionFactor)
  if (emission === null || emissionStandardDeviation === null || factorStandardDeviation === null) {
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
  const standardDeviation = getStandardDeviation(emissionSource, emission)
  const confidenceInterval = standardDeviation ? getConfidenceInterval(emission, standardDeviation) : null
  const alpha = getAlpha(emission, confidenceInterval)

  return {
    emission,
    standardDeviation,
    confidenceInterval,
    alpha,
  }
}

export const sumEmissionSourcesResults = (emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources']) => {
  const results = emissionSource.map(getEmissionResults).filter((result) => result !== null)
  const total = results.reduce((acc, result) => acc + result.emission, 0)
  return Math.pow(
    Math.exp(
      Math.sqrt(
        results.reduce(
          (acc, result) =>
            acc + Math.pow(result.emission / total, 2) * Math.pow(Math.log(result.standardDeviation || 1), 2),
          0,
        ),
      ),
    ),
    2,
  )
}

export const getEmissionSourcesTotalCo2 = (emissionSources: FullStudy['emissionSources']) =>
  emissionSources.reduce(
    (sum, emissionSource) => sum + (emissionSource.value || 0) * (emissionSource.emissionFactor?.totalCo2 || 0),
    0,
  )
