import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { Export, ExportRule, Level, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { EmissionFactorWithMetaData } from './emissionFactors'
import { canBeValidated, getEmissionSourcesTotalCo2, getStandardDeviation } from './emissionSource'
import { download } from './file'
import { StudyWithoutDetail } from './permissions/study'
import { Post, subPostsByPost } from './posts'
import { computeBegesResult } from './results/beges'
import { computeResultsByPost } from './results/consolidated'
import { getEmissionFactorByIds } from './serverFunctions/emissionFactor'
import { prepareExcel } from './serverFunctions/file'
import { getUserSettings } from './serverFunctions/user'
import {
  getEmissionSourcesGlobalUncertainty,
  getQualityRating,
  getStandardDeviationRating,
  sumQualities,
} from './uncertainty'

const getQuality = (quality: ReturnType<typeof getQualityRating>, t: ReturnType<typeof useTranslations>) => {
  return quality === null ? t('unknown') : t(quality.toString())
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

export const checkLevel = (userLevel: Level | null, targetLevel: Level) =>
  userLevel ? getAllowedLevels(userLevel).includes(targetLevel) : false

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

  if (canBeValidated(emissionSource, study, emissionSource.emissionFactor)) {
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
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
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
      'sourceUnit',
      'sourceQuality',
      'activityDataValue',
      'activityDataUnit',
      'activityDataQuality',
      'activityDataComment',
      'emissionName',
      'emissionValue',
      'emissionUnit',
      'emissionQuality',
      'emissionSource',
    ])
    .map((key) => t(key))
    .join(';')

  const rows = emissionSources
    .sort((a, b) => a.subPost.localeCompare(b.subPost))
    .map((emissionSource) => {
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
      const emissionSourceSD = getStandardDeviation(emissionSource)
      return initCols
        .concat([
          emissionSource.validated ? t('yes') : t('no'),
          emissionSource.name || '',
          tCaracterisations(emissionSource.caracterisation || ''),
          (emissionSource.value || 0) * (emissionFactor?.totalCo2 || 0) || '0',
          'kgCO₂e',
          emissionSourceSD ? getQuality(getStandardDeviationRating(emissionSourceSD), tQuality) : '',
          emissionSource.value || '0',
          emissionFactor?.unit ? tUnit(emissionFactor.unit) : '',
          getQuality(getQualityRating(emissionSource), tQuality),
          emissionSource.comment || '',
          emissionFactor?.metaData?.title || t('noFactor'),
          emissionFactor?.totalCo2 || '',
          emissionFactor?.unit ? `kgCO₂e/${tUnit(emissionFactor.unit)}` : '',
          emissionFactor ? getQuality(getQualityRating(emissionFactor), tQuality) : '',
          emissionFactor?.source || '',
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
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
  type?: 'Post' | 'Study',
) => {
  const { columns, rows } = getEmissionSourcesRows(
    emissionSources,
    emissionFactors,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
    type,
  )

  const emptyFieldsCount = type === 'Study' ? 3 : type === 'Post' ? 2 : 1
  const emptyFields = (count: number) => Array(count).fill('')

  const totalEmissions = getEmissionSourcesTotalCo2(emissionSources)
  const totalRow = [t('total'), ...emptyFields(emptyFieldsCount + 1), totalEmissions].join(';')

  const qualities = emissionSources.map((emissionSource) => getStandardDeviation(emissionSource))
  const quality = getQuality(getStandardDeviationRating(sumQualities(qualities)), tQuality)
  const qualityRow = [t('quality'), ...emptyFields(emptyFieldsCount + 1), quality].join(';')

  const uncertainty = getEmissionSourcesGlobalUncertainty(emissionSources)
  const uncertaintyRow = [t('uncertainty'), ...emptyFields(emptyFieldsCount), uncertainty[0], uncertainty[1]].join(';')

  return [columns, ...rows, totalRow, qualityRow, uncertaintyRow].join('\n')
}

export const downloadStudySubPosts = async (
  study: FullStudy,
  post: string,
  subPost: SubPost,
  emissionSources: FullStudy['emissionSources'],
  emissionFactors: EmissionFactorWithMetaData[],
  t: ReturnType<typeof useTranslations>,
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
) => {
  const fileName = getFileName(study, post, subPost)
  const csvContent = getEmissionSourcesCSVContent(
    emissionSources,
    emissionFactors,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
  )
  downloadCSV(csvContent, fileName)
}

export const downloadStudyPost = async (
  study: FullStudy,
  emissionSources: FullStudy['emissionSources'],
  post: Post | SubPost,
  t: ReturnType<typeof useTranslations>,
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
) => {
  const emissionFactorIds = emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)
  const emissionFactors = await getEmissionFactorByIds(emissionFactorIds)
  const fileName = getFileName(study, post)
  const csvContent = getEmissionSourcesCSVContent(
    emissionSources,
    emissionFactors,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
    'Post',
  )
  downloadCSV(csvContent, fileName)
}

export const downloadStudyEmissionSources = async (
  study: FullStudy,
  t: ReturnType<typeof useTranslations>,
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
) => {
  const emissionSources = study.emissionSources.sort((a, b) => a.subPost.localeCompare(b.subPost))

  const emissionFactorIds = emissionSources
    .map((emissionSource) => emissionSource.emissionFactor?.id)
    .filter((emissionFactorId) => emissionFactorId !== undefined)
  const emissionFactors = await getEmissionFactorByIds(emissionFactorIds)
  const fileName = getFileName(study)
  const csvContent = getEmissionSourcesCSVContent(
    emissionSources,
    emissionFactors,
    t,
    tCaracterisations,
    tPost,
    tQuality,
    tUnit,
    'Study',
  )
  downloadCSV(csvContent, fileName)
}

export const formatConsolidatedStudyResultsForExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  tStudy: ReturnType<typeof useTranslations>,
  tExport: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  validatedEmissionSourcesOnly?: boolean,
) => {
  const dataForExport = []

  for (const site of siteList) {
    const resultList = computeResultsByPost(study, tPost, site.id, true, validatedEmissionSourcesOnly)

    dataForExport.push([site.name])
    dataForExport.push([tStudy('post'), tStudy('uncertainty'), tStudy('value')])

    for (const result of resultList) {
      dataForExport.push([
        tPost(result.post) ?? '',
        result.uncertainty ? tQuality(getStandardDeviationRating(result.uncertainty).toString()) : '',
        result.value ?? '',
      ])
    }

    dataForExport.push([])
  }

  return {
    name: tExport('consolidated'),
    data: dataForExport,
    options: { '!cols': [{ wch: 30 }, { wch: 15 }, { wch: 20 }] },
  }
}

export const formatBegesStudyResultsForExport = (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  siteList: { name: string; id: string }[],
  tExport: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tBeges: ReturnType<typeof useTranslations>,
  validatedEmissionSourcesOnly?: boolean,
) => {
  const lengthOfBeges = 33
  const dataForExport = []

  const sheetOptions: { '!merges': object[]; '!cols': object[] } = {
    '!merges': [],
    '!cols': [
      { wch: 50 },
      { wch: 60 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ],
  }

  for (let i = 0; i < siteList.length; i++) {
    const site = siteList[i]
    const resultList = computeBegesResult(
      study,
      rules,
      emissionFactorsWithParts,
      site.id,
      true,
      validatedEmissionSourcesOnly,
    )

    // Merge cells
    sheetOptions['!merges'].push(
      { s: { c: 0, r: 3 + i * lengthOfBeges }, e: { c: 0, r: 8 + i * lengthOfBeges } },
      { s: { c: 0, r: 9 + i * lengthOfBeges }, e: { c: 0, r: 11 + i * lengthOfBeges } },
      { s: { c: 0, r: 12 + i * lengthOfBeges }, e: { c: 0, r: 17 + i * lengthOfBeges } },
      { s: { c: 0, r: 18 + i * lengthOfBeges }, e: { c: 0, r: 23 + i * lengthOfBeges } },
      { s: { c: 0, r: 24 + i * lengthOfBeges }, e: { c: 0, r: 28 + i * lengthOfBeges } },
      { s: { c: 0, r: 29 + i * lengthOfBeges }, e: { c: 0, r: 30 + i * lengthOfBeges } },
    )

    dataForExport.push([site.name])
    dataForExport.push([tBeges('rule'), '', tBeges('ges')])
    dataForExport.push([
      tBeges('category.title'),
      tBeges('post.title'),
      'CO2',
      'CH4',
      'N2O',
      tBeges('other'),
      tBeges('total'),
      'CO2b',
      tBeges('uncertainty'),
    ])

    for (const result of resultList) {
      const category = result.rule.split('.')[0]
      const rule = result.rule
      let post
      if (rule === 'total') {
        post = tBeges('total')
      } else if (result.rule.includes('.total')) {
        post = tBeges('subTotal')
      } else {
        post = `${rule}. ${tBeges(`post.${rule}`)}`
      }

      dataForExport.push([
        category === 'total' ? '' : `${category}. ${tBeges(`category.${category}`)}`,
        post,
        result.co2,
        result.ch4,
        result.n2o,
        result.other,
        result.total,
        result.co2b,
        result.uncertainty ? tQuality(getStandardDeviationRating(result.uncertainty).toString()) : '',
      ])
    }

    dataForExport.push([])
  }

  return { name: tExport('Beges'), data: dataForExport, options: sheetOptions }
}

export const downloadStudyResults = async (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  tStudy: ReturnType<typeof useTranslations>,
  tExport: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tOrga: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tBeges: ReturnType<typeof useTranslations>,
) => {
  const data = []

  const siteList = [
    { name: tOrga('allSites'), id: 'all' },
    ...study.sites.map((s) => ({ name: s.site.name, id: s.id })),
  ]

  const validatedEmissionSourcesOnly = (await getUserSettings())?.validatedEmissionSourcesOnly

  data.push(
    formatConsolidatedStudyResultsForExport(
      study,
      siteList,
      tStudy,
      tExport,
      tPost,
      tQuality,
      validatedEmissionSourcesOnly,
    ),
  )

  if (study.exports.some((exp) => exp.type === Export.Beges)) {
    data.push(
      formatBegesStudyResultsForExport(
        study,
        rules,
        emissionFactorsWithParts,
        siteList,
        tExport,
        tQuality,
        tBeges,
        validatedEmissionSourcesOnly,
      ),
    )
  }

  const buffer = await prepareExcel(data)

  download([buffer], `${study.name}_results.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}
