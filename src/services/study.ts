import { FullStudy } from '@/db/study'
import { Level, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { EmissionFactorWithMetaData } from './emissionFactors'
import { download } from './file'
import { StudyWithoutDetail } from './permissions/study'
import { Post, subPostsByPost } from './posts'
import { getEmissionFactorByIds } from './serverFunctions/emissionFactor'
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

const getEmissionSourceRows = (
  emissionSources: FullStudy['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  type?: 'Post' | 'Study',
) => {
  const initCols = []
  if (type === 'Post') {
    initCols.push('subPost')
  } else if (type === 'Study') {
    initCols.push('post')
    initCols.push('subPost')
  }
  const columns = initCols
    .concat([
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
    ])
    .map((key) => t(key))
    .join(';')

  const rows = emissionSources.map((emissionSource) => {
    const emissionFactor = emissionFactors.find((factor) => factor.id === emissionSource.emissionFactor?.id)
    const initCols: (string | number)[] = []
    if (type === 'Post') {
      initCols.push(tPost(emissionSource.subPost))
    } else if (type === 'Study') {
      const post = Object.keys(subPostsByPost).find((post) =>
        subPostsByPost[post as Post].includes(emissionSource.subPost),
      )
      initCols.push(tPost(post))
      initCols.push(tPost(emissionSource.subPost))
    }
    return initCols
      .concat([
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
      ])
      .map((field) => encodeCSVField(field))
      .join(';')
  })
  return { columns, rows }
}

export const downloadStudySubPosts = async (
  study: FullStudy,
  post: string,
  subPost: SubPost,
  emissionSources: FullStudy['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
) => {
  const { columns, rows } = getEmissionSourceRows(emissionSources, emissionFactors, t, tPost, tQuality)

  const totalEmissions = emissionSources.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalRow = [t('total'), '', '', totalEmissions].join(';')

  // TODO : Ajouter la ligne des incertitudes
  const csvContent = [columns, ...rows, totalRow].join('\n')

  const date = dayjs()
  const formattedDate = date.format('YYYY_MM_DD')
  const fileName = `${study.name}_${post}_${subPost}_${formattedDate}.csv`

  // \ufeff  (Byte Order Mark) adds BOM to indicate UTF-8 encoding
  download(['\ufeff', csvContent], fileName, 'text/csv;charset=utf-8;')
}

export const downloadStudyPost = async (
  study: FullStudy,
  post: Post | SubPost,
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
) => {
  const validSubPosts = Object.keys(subPostsByPost).includes(post) ? subPostsByPost[post as Post] : [post]
  const emissionSources = study.emissionSources
    .filter((emissionSource) => validSubPosts.includes(emissionSource.subPost))
    .sort((a, b) => a.subPost.localeCompare(b.subPost))

  const emissionFactorIds = (emissionSources || [])
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)
  const emissionFactors = await getEmissionFactorByIds(emissionFactorIds)

  const { columns, rows } = getEmissionSourceRows(emissionSources, emissionFactors, t, tPost, tQuality, 'Post')

  const totalEmissions = emissionSources.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalRow = [t('total'), '', '', '', totalEmissions].join(';')

  // TODO : Ajouter la ligne des incertitudes
  const csvContent = [columns, ...rows, totalRow].join('\n')

  const date = dayjs()
  const formattedDate = date.format('YYYY_MM_DD')
  const fileName = `${study.name}_${post}_${formattedDate}.csv`

  download(['\ufeff', csvContent], fileName, 'text/csv;charset=utf-8;')
}

export const downloadStudyEmissionSources = async (
  study: FullStudy,
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
) => {
  const emissionSources = study.emissionSources.sort((a, b) => a.subPost.localeCompare(b.subPost))

  const emissionFactorIds = (emissionSources || [])
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)
  const emissionFactors = await getEmissionFactorByIds(emissionFactorIds)

  const { columns, rows } = getEmissionSourceRows(emissionSources, emissionFactors, t, tPost, tQuality, 'Study')

  const totalEmissions = emissionSources.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalRow = [t('total'), '', '', '', totalEmissions].join(';')

  // TODO : Ajouter la ligne des incertitudes
  const csvContent = [columns, ...rows, totalRow].join('\n')

  const date = dayjs()
  const formattedDate = date.format('YYYY_MM_DD')
  const fileName = `${study.name}_${formattedDate}.csv`

  download(['\ufeff', csvContent], fileName, 'text/csv;charset=utf-8;')
}
