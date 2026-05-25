import { EngagementActionTargets } from '@/constants/engagementActions'
import type { FullStudy } from '@/db/study'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { getEmissionSourcesTotalCo2 } from '@/utils/emissionSources'
import { getPost } from '@/utils/post'
import { formatEmissionValueForExport, hasDeprecationPeriod, isCAS } from '@/utils/study'
import { Environment, Level, StudyResultUnit, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { Translations } from '@abc-transitionbascarbone/lib'
import { formatDateFr } from '@abc-transitionbascarbone/utils/time'
import dayjs from 'dayjs'
import { getEmissionResults, getEmissionSourceEmission } from './emissionSource'
import { download } from './file'
import { Post } from './posts'
import { EmissionFactorWithMetaData, getEmissionFactorsByIds } from './serverFunctions/emissionFactor'
import {
  getEmissionSourcesConfidenceInterval,
  getQualitativeUncertaintyForEmissionSources,
  getQualitativeUncertaintyFromQuality,
  getQualitativeUncertaintyFromSquaredStandardDeviation,
  getSquaredStandardDeviationForEmissionSource,
} from './uncertainty'

const getQuality = (quality: ReturnType<typeof getQualitativeUncertaintyFromQuality>, t: Translations) => {
  return quality === null ? t('unknown') : t(quality.toString())
}

const downloadCSV = (csvContent: string, fileName: string) => {
  // \ufeff  (Byte Order Mark) adds BOM to indicate UTF-8 encoding
  return download(['\ufeff', csvContent], fileName, 'csv')
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

const getEmissionSourcesCSVContent = (
  emissionSources: FullStudy['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
  resultsUnit: StudyResultUnit,
  t: Translations,
  tCaracterisations: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnit: Translations,
  tResultUnits: Translations,
  tBase: Translations,
  environment: Environment,
  type?: 'Post' | 'Study',
) => {
  const { columns, rows } = getEmissionSourcesRows(
    emissionSources,
    emissionFactors,
    resultsUnit,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
    tResultUnits,
    tBase,
    type,
    environment,
  )

  const emptyFieldsCount = type === 'Study' ? 4 : type === 'Post' ? 3 : 2
  const emptyFields = (count: number) => Array(count).fill('')

  const emissionSourcesWithEmission = emissionSources.map((emissionSource) => ({
    ...emissionSource,
    ...getEmissionResults(emissionSource, environment),
  }))
  const totalEmissions = formatEmissionValueForExport(
    getEmissionSourcesTotalCo2(emissionSourcesWithEmission),
    resultsUnit,
  )
  const totalRow = [t('total'), ...emptyFields(emptyFieldsCount + 1), totalEmissions].join(';')

  const quality = getQuality(getQualitativeUncertaintyForEmissionSources(emissionSourcesWithEmission), tQuality)
  const qualityRow = [t('quality'), ...emptyFields(emptyFieldsCount + 1), quality].join(';')

  const confidenceInterval = getEmissionSourcesConfidenceInterval(emissionSourcesWithEmission)
  const uncertaintyRow = [
    t('uncertainty'),
    ...emptyFields(emptyFieldsCount),
    formatEmissionValueForExport(confidenceInterval[0], resultsUnit),
    formatEmissionValueForExport(confidenceInterval[1], resultsUnit),
  ].join(';')

  return [columns, ...rows, totalRow, qualityRow, uncertaintyRow].join('\n')
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
  resultsUnit: StudyResultUnit,
  t: Translations,
  tCaracterisations: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnit: Translations,
  tResultUnits: Translations,
  tBase: Translations,
  type?: 'Post' | 'Study',
  environment?: Environment,
) => {
  const initCols = ['site']
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
      'sourceConstructionYear',
      'sourceValue',
      'sourceDeprecation',
      'sourceSurface',
      'sourceDuration',
      'sourceUnit',
      'sourceQuality',
      'sourceTag',
      'activityDataValue',
      'activityDataUnit',
      'activityDataQuality',
      'activityDataComment',
      'emissionName',
      'emissionValue',
      'emissionUnit',
      'emissionQuality',
      'emissionSource',
      'emissionBase',
    ])
    .map((key) => t(key))
    .join(';')

  const rows = [...emissionSources]
    .sort((a, b) => a.subPost.localeCompare(b.subPost))
    .map((emissionSource) => {
      const emissionFactor = emissionFactors.find((factor) => factor.id === emissionSource.emissionFactor?.id)
      const initCols: (string | number)[] = [emissionSource.studySite.site.name]
      if (type === 'Post') {
        initCols.push(tPost(emissionSource.subPost))
      } else if (type === 'Study') {
        const post = getPost(emissionSource.subPost)
        initCols.push(tPost(post || ''))
        initCols.push(tPost(emissionSource.subPost))
      }
      const emissionSourceSD = getSquaredStandardDeviationForEmissionSource(emissionSource)

      const withDeprecation = hasDeprecationPeriod(emissionSource.subPost)

      return initCols
        .concat([
          emissionSource.validated ? t('yes') : t('no'),
          emissionSource.name || '',
          emissionSource.caracterisation ? tCaracterisations(emissionSource.caracterisation) : '',
          emissionSource.constructionYear ? emissionSource.constructionYear.getFullYear() : '',
          formatEmissionValueForExport(getEmissionSourceEmission(emissionSource, environment) || 0, resultsUnit),
          withDeprecation ? emissionSource.depreciationPeriod || '1' : ' ',
          isCAS(emissionSource) ? emissionSource.hectare || '1' : ' ',
          isCAS(emissionSource) ? emissionSource.duration || '1' : ' ',
          tResultUnits(resultsUnit),
          emissionSourceSD
            ? getQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(emissionSourceSD), tQuality)
            : '',
          emissionSource.emissionSourceTags.map((emissionSourceTag) => emissionSourceTag.tag.name).join(', ') || '',
          emissionSource.value?.toLocaleString('fr-FR', { useGrouping: false }) || '0',
          emissionFactor?.unit ? tUnit(emissionFactor.unit, { count: 1 }) : '',
          getQuality(getQualitativeUncertaintyFromQuality(emissionSource), tQuality),
          emissionSource.comment || '',
          emissionFactor?.metaData?.title || t('noFactor'),
          emissionFactor
            ? getEmissionFactorValue(emissionFactor, environment).toLocaleString('fr-FR', { useGrouping: false })
            : '',
          emissionFactor?.unit ? `${tResultUnits(StudyResultUnit.K)}/${tUnit(emissionFactor.unit, { count: 1 })}` : '',
          emissionFactor ? getQuality(getQualitativeUncertaintyFromQuality(emissionFactor), tQuality) : '',
          emissionFactor?.source || '',
          emissionFactor?.base ? tBase(emissionFactor.base) : '',
        ])
        .map((field) => encodeCSVField(field))
        .join(';')
    })
  return { columns, rows }
}

export const downloadStudyPost = async (
  study: FullStudy,
  emissionSources: FullStudy['emissionSources'],
  post: Post | SubPost,
  t: Translations,
  tCaracterisations: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnit: Translations,
  tResultUnits: Translations,
  tBase: Translations,
  environment: Environment,
) => {
  const emissionFactorIds = emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)

  const emissionFactorsData = await getEmissionFactorsByIds(emissionFactorIds, study.id)

  const fileName = getFileName(study, post)
  const csvContent = getEmissionSourcesCSVContent(
    emissionSources,
    emissionFactorsData.success ? emissionFactorsData.data : [],
    study.resultsUnit,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
    tResultUnits,
    tBase,
    environment,
    'Post',
  )

  downloadCSV(csvContent, fileName)
}

export const downloadEngagementActionsCSV = (
  actions: {
    name: string
    description: string
    steps: string
    targets: string[]
    phase: string
    date: Date
    sites?: { site: { name: string } }[]
  }[],
  studyName: string,
  t: Translations,
  tTargets: Translations,
  tSteps: Translations,
  tPhases: Translations,
) => {
  const headers = [
    t('table.name'),
    t('table.description'),
    t('table.steps'),
    t('table.target'),
    t('table.phase'),
    t('table.date'),
    t('table.sites'),
  ]

  const engagementActionTargets = Object.values(EngagementActionTargets) as string[]

  const rows = actions.map((action) => {
    const targets =
      action.targets
        ?.map((target) => {
          if (engagementActionTargets.includes(target)) {
            return tTargets(target)
          }
          return target
        })
        .join(', ') || ''

    const sites = action.sites?.map((site) => site.site.name).join(', ') || ''
    const step = tSteps(action.steps) || action.steps
    const phase = tPhases(action.phase) || action.phase
    const formattedDate = formatDateFr(action.date)

    return [action.name, action.description, step, targets, phase, formattedDate, sites]
  })

  const csvContent = [headers.join(';'), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';'))].join('\n')

  const fileName = `${studyName} - ${t('title')}.csv`
  downloadCSV(csvContent, fileName)
}

export const downloadStudyEmissionSources = async (
  study: FullStudy,
  t: Translations,
  tCaracterisations: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnit: Translations,
  tResultUnits: Translations,
  tBase: Translations,
  environment: Environment,
) => {
  const emissionSources = [...study.emissionSources].sort((a, b) => a.subPost.localeCompare(b.subPost))

  const emissionFactorIds = emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)

  const emissionFactorsData = await getEmissionFactorsByIds(emissionFactorIds, study.id)

  const fileName = getFileName(study)
  const csvContent = getEmissionSourcesCSVContent(
    emissionSources,
    emissionFactorsData.success ? emissionFactorsData.data : [],
    study.resultsUnit,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
    tResultUnits,
    tBase,
    environment,
    'Study',
  )

  downloadCSV(csvContent, fileName)
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

export const hasSufficientLevel = (userLevel: Level | null, targetLevel: Level) =>
  userLevel ? getAllowedLevels(userLevel).includes(targetLevel) : false
