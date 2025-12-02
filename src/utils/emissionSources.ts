import { FullStudy } from '@/db/study'
import { getStandardDeviation } from '@/services/emissionSource'
import { getQualityRating, getSpecificEmissionFactorQuality, getStandardDeviationRating } from '@/services/uncertainty'
import { Translations } from '@/types/translation'

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
