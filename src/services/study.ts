import { FullStudy } from '@/db/study'
import { Level, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { EmissionFactorWithMetaData } from './emissionFactors'
import { download } from './file'
import { StudyWithoutDetail } from './permissions/study'
import { getQualityRating } from './uncertainty'

const getQuality = (quality: ReturnType<typeof getQualityRating>, t: ReturnType<typeof useTranslations>) => {
  return quality === null ? t('unknown') : t(quality.toString())
}

export enum NewStudyRightStatus {
  SameOrganization,
  OtherOrganization,
  NonExisting,
}

export const getAllowedLevels = (level: Level | null) => {
  switch (level) {
    case Level.Advanced:
      return [Level.Initial]
    case Level.Standard:
      return [Level.Initial, Level.Standard]
    case Level.Initial:
      return [Level.Initial, Level.Standard, Level.Advanced]
    default:
      return []
  }
}

export enum EmissionSourcesStatus {
  Valid = 'valid',
  ToVerify = 'toVerify',
  Waiting = 'waiting',
  WaitingContributor = 'waitingContributor',
}

export const getEmissionSourceStatus = (
  study: FullStudy | StudyWithoutDetail,
  emissionSource: (FullStudy | StudyWithoutDetail)['emissionSources'][0],
) => {
  if (emissionSource.validated) {
    return EmissionSourcesStatus.Valid
  }

  if (emissionSource.value !== null && emissionSource.emissionFactor !== null) {
    return EmissionSourcesStatus.ToVerify
  }

  if (study.contributors && study.contributors.some((contributor) => contributor.subPost === emissionSource.subPost)) {
    return EmissionSourcesStatus.WaitingContributor
  }

  return EmissionSourcesStatus.Waiting
}

const encodeCSVField = (field: string | number = '') => {
  if (typeof field === 'number') {
    return field
  }
  const escapedField = field.replace(/"/g, '""')
  if (escapedField.includes(';') || escapedField.includes('"') || escapedField.includes("'")) {
    return `"${escapedField}"`
  }
  return escapedField
}

export const downloadStudySubPosts = async (
  study: FullStudy,
  post: string,
  subPost: SubPost,
  emissionSources: FullStudy['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
  t: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
) => {
  const columns = [
    'validation',
    'sourceName',
    'sourceCharacterization',
    'sourceValue',
    'sourceComment',
    'sourceQuality',
    'emissionName',
    'emissionValue',
    'emissionSource',
    'emissionQuality',
  ]
    .map((key) => t(key))
    .join(';')

  const csvRows = emissionSources.map((emissionSource) => {
    const emissionFactor = emissionFactors.find((factor) => factor.id === emissionSource.emissionFactor?.id)
    return [
      emissionSource.validated ? t('yes') : t('no'),
      emissionSource.name || '',
      emissionSource.caracterisation || '',
      emissionSource.value || '0',
      emissionSource.comment || '',
      getQuality(getQualityRating(emissionSource), tQuality),
      emissionFactor?.metaData?.title || t('noFactor'),
      emissionFactor?.totalCo2 || '',
      emissionFactor?.source || '',
      emissionFactor ? getQuality(getQualityRating(emissionFactor), tQuality) : '',
    ]
      .map((field) => encodeCSVField(field))
      .join(';')
  })

  const totalEmissions = emissionSources.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalRow = [t('total'), '', '', totalEmissions].join(';')

  // TODO : Ajouter la ligne des incertitudes
  const csvContent = [columns, ...csvRows, totalRow].join('\n')

  const date = dayjs()
  const formattedDate = date.format('YYYY_MM_DD')
  const fileName = `${study.name}_${post}_${subPost}_${formattedDate}.csv`

  // \ufeff  (Byte Order Mark) adds BOM to indicate UTF-8 encoding
  download(['\ufeff', csvContent], fileName, 'text/csv;charset=utf-8;')
}
