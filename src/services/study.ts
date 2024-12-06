import { FullStudy } from '@/db/study'
import { Level, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { EmissionFactorWithMetaData } from './emissionFactors'
import { getEmissionSourcesTotalCo2 } from './emissionSource'
import { download } from './file'
import { StudyWithoutDetail } from './permissions/study'
import { Post, subPostsByPost } from './posts'
import { getEmissionFactorByIds } from './serverFunctions/emissionFactor'
import { getEmissionSourcesGlobalUncertainty, getQualityRating } from './uncertainty'

const getQuality = (quality: ReturnType<typeof getQualityRating>, t: ReturnType<typeof useTranslations>) => {
  return quality === null ? t('unknown') : t(quality.toString())
}

export enum NewStudyRightStatus {
  Valid,
  OtherOrganization,
  ReaderOnly,
}

export const getAllowedLevels = (level: Level | null) => {
  switch (level) {
    case Level.Initial:
      return [Level.Initial]
    case Level.Standard:
      return [Level.Initial, Level.Standard]
    case Level.Advanced:
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

const getEmissionSourcesRows = (
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

const getFileName = (study: FullStudy, post?: string, subPost?: SubPost) => {
  let name = study.name

  if (post) {
    name += `_${post}`
  }
  if (subPost) {
    name += `_${subPost}`
  }

  const date = dayjs()
  const formattedDate = date.format('YYYY_MM_DD')
  return `${name}_${formattedDate}.csv`
}

const downloadCSV = (csvContent: string, fileName: string) => {
  // \ufeff  (Byte Order Mark) adds BOM to indicate UTF-8 encoding
  return download(['\ufeff', csvContent], fileName, 'text/csv;charset=utf-8;')
}

const getEmissionSourcesCSVContent = (
  emissionSources: FullStudy['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  type?: 'Post' | 'Study',
) => {
  const { columns, rows } = getEmissionSourcesRows(emissionSources, emissionFactors, t, tPost, tQuality, type)

  const emptyFieldsCount = type === 'Study' ? 3 : type === 'Post' ? 2 : 1
  const emptyFields = (count: number) => Array(count).fill('')

  const totalEmissions = getEmissionSourcesTotalCo2(emissionSources)
  const totalRow = [t('total'), ...emptyFields(emptyFieldsCount + 1), totalEmissions].join(';')

  const uncertainty = getEmissionSourcesGlobalUncertainty(emissionSources)
  const uncertaintyRow = [t('uncertainty'), ...emptyFields(emptyFieldsCount), uncertainty[0], uncertainty[1]].join(';')

  return [columns, ...rows, totalRow, uncertaintyRow].join('\n')
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
  const fileName = getFileName(study, post, subPost)
  const csvContent = getEmissionSourcesCSVContent(emissionSources, emissionFactors, t, tPost, tQuality)
  downloadCSV(csvContent, fileName)
}

export const downloadStudyPost = async (
  study: FullStudy,
  emissionSources: FullStudy['emissionSources'],
  post: Post | SubPost,
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
) => {
  const emissionFactorIds = emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)
  const emissionFactors = await getEmissionFactorByIds(emissionFactorIds)
  const fileName = getFileName(study, post)
  const csvContent = getEmissionSourcesCSVContent(emissionSources, emissionFactors, t, tPost, tQuality, 'Post')
  downloadCSV(csvContent, fileName)
}

export const downloadStudyEmissionSources = async (
  study: FullStudy,
  t: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
) => {
  const emissionSources = study.emissionSources.sort((a, b) => a.subPost.localeCompare(b.subPost))

  const emissionFactorIds = emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)
  const emissionFactors = await getEmissionFactorByIds(emissionFactorIds)
  const fileName = getFileName(study)
  const csvContent = getEmissionSourcesCSVContent(emissionSources, emissionFactors, t, tPost, tQuality, 'Study')
  downloadCSV(csvContent, fileName)
}
