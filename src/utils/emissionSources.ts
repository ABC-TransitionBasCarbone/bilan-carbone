import { FullStudy } from '@/db/study'
import { getEmissionResults, getStandardDeviation } from '@/services/emissionSource'
import { getQualityRating, getSpecificEmissionFactorQuality, getStandardDeviationRating } from '@/services/uncertainty'
import { EmissionSourcesSort } from '@/types/filters'
import { Translations } from '@/types/translation'
import { Environment } from '@prisma/client'

export const getEmissionSourcesFuseOptions = (tQuality: Translations, tUnit: Translations, locale: string) => ({
  keys: [
    { name: 'name', weight: 1 },
    { name: 'source', weight: 0.5 },
    { name: 'value', weight: 0.3 },
    { name: 'comment', weight: 0.3 },
    {
      name: 'quality',
      getFn: (emissionSource: FullStudy['emissionSources'][number]) => {
        const standardD = getStandardDeviation(emissionSource) || 0
        return tQuality(getStandardDeviationRating(standardD).toString())
      },
      weight: 0.3,
    },
    {
      name: 'emissionFactorName',
      getFn: (emissionSource: FullStudy['emissionSources'][number]) => {
        const metaData = emissionSource.emissionFactor?.metaData.find((metaData) => metaData.language === locale)
        return metaData ? metaData.title || '' : ''
      },
      weight: 0.7,
    },
    {
      name: 'emissionFactorLocation',
      getFn: (emissionSource: FullStudy['emissionSources'][number]) => emissionSource.emissionFactor?.location || '',
      weight: 0.5,
    },
    {
      name: 'emissionFactorValue',
      getFn: (emissionSource: FullStudy['emissionSources'][number]) =>
        emissionSource.emissionFactor?.totalCo2.toString() || '',
      weight: 0.3,
    },
    {
      name: 'emissionFactorUnit',
      getFn: (emissionSource: FullStudy['emissionSources'][number]) =>
        tUnit(emissionSource.emissionFactor?.unit || '', { count: 0 }),
      weight: 0.3,
    },
    {
      name: 'emissionFactorQuality',
      getFn: (emissionSource: FullStudy['emissionSources'][number]) => {
        const qualityRating = getQualityRating(getSpecificEmissionFactorQuality(emissionSource)) || 'unknown'
        return tQuality(qualityRating.toString())
      },
      weight: 0.3,
    },
  ],
  threshold: 0.3,
  isCaseSensitive: false,
})

export const getSortedEmissionSources = (
  emissionSources: FullStudy['emissionSources'],
  sort: EmissionSourcesSort,
  environment: Environment,
  locale: string,
) => {
  if (sort.field) {
    switch (sort.field) {
      case 'activityData':
        return emissionSources.sort((a, b) =>
          sort.order === 'asc' ? (a.value || 0) - (b.value || 0) : (b.value || 0) - (a.value || 0),
        )

      case 'emissions':
        return emissionSources.sort((a, b) => {
          const emissionA = (a.value || 0) * (a.emissionFactor?.totalCo2 || 0)
          const emissionB = (b.value || 0) * (b.emissionFactor?.totalCo2 || 0)
          return sort.order === 'asc' ? emissionA - emissionB : emissionB - emissionA
        })

      case 'emissionFactor':
        return emissionSources.sort((a, b) => {
          const emissionFactorA =
            a.emissionFactor?.metaData.find((metaData) => metaData.language === locale)?.title || ''
          const emissionFactorB =
            b.emissionFactor?.metaData.find((metaData) => metaData.language === locale)?.title || ''
          return sort.order === 'asc'
            ? emissionFactorA.localeCompare(emissionFactorB)
            : emissionFactorB.localeCompare(emissionFactorA)
        })

      case 'uncertainty':
        return emissionSources.sort((a, b) => {
          const alphaA = getEmissionResults(a, environment).alpha || 0
          const alphaB = getEmissionResults(b, environment).alpha || 0
          return sort.order === 'asc' ? alphaA - alphaB : alphaB - alphaA
        })
    }
  }
  return emissionSources
}
