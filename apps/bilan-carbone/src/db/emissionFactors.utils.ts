import { LocaleType } from '@/i18n/config'
import type { EmissionFactorList } from './emissionFactors'

export const keepOnlyOneMetadata = <T extends { metaData: EmissionFactorList['metaData'][] }>(
  emissionFactors: T[],
  locale: LocaleType,
): (T & { metaData: EmissionFactorList['metaData'] })[] => {
  return emissionFactors.map((ef) => ({
    ...ef,
    metaData: ef.metaData.find((meta) => meta.language === locale) ?? {
      language: locale,
      title: null,
      attribute: null,
      comment: null,
      location: null,
      frontiere: null,
    },
  }))
}
