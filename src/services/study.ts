import { resultsExportHeadersBase, resultsExportHeadersCut } from '@/constants/exports'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy, getStudyById } from '@/db/study'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { getPost } from '@/utils/post'
import { isCAS, STUDY_UNIT_VALUES } from '@/utils/study'
import { Environment, Export, ExportRule, Level, StudyResultUnit, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { canBeValidated, getEmissionResults, getEmissionSourcesTotalCo2, getStandardDeviation } from './emissionSource'
import { download } from './file'
import { hasAccessToBcExport } from './permissions/environment'
import { StudyWithoutDetail } from './permissions/study'
import { convertCountToBilanCarbone, environmentPostMapping, Post, subPostsByPost } from './posts'
import { computeBegesResult } from './results/beges'
import { computeResultsByPost, computeResultsByTag } from './results/consolidated'
import { EmissionFactorWithMetaData, getEmissionFactorsByIds } from './serverFunctions/emissionFactor'
import { prepareExcel } from './serverFunctions/file'
import { getUserSettings } from './serverFunctions/user'
import {
  getEmissionSourcesGlobalUncertainty,
  getQualityRating,
  getStandardDeviationRating,
  sumQualities,
} from './uncertainty'

export enum AdditionalResultTypes {
  CONSOLIDATED = 'consolidated',
  ENV_SPECIFIC_EXPORT = 'env_specific_export',
}
export type ResultType = Export | AdditionalResultTypes

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
  environment: Environment | undefined,
) => {
  if (emissionSource.validated) {
    return EmissionSourcesStatus.Valid
  }

  if (canBeValidated(emissionSource, study, emissionSource.emissionFactor, environment)) {
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
  resultsUnit: StudyResultUnit,
  t: ReturnType<typeof useTranslations>,
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
  tResultUnits: ReturnType<typeof useTranslations>,
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
      const emissionSourceSD = getStandardDeviation(emissionSource)

      const withDeprecation = subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost)

      return initCols
        .concat([
          emissionSource.validated ? t('yes') : t('no'),
          emissionSource.name || '',
          emissionSource.caracterisation ? tCaracterisations(emissionSource.caracterisation) : '',
          ((emissionSource.value || 0) * (emissionFactor ? getEmissionFactorValue(emissionFactor, environment) : 0)) /
            STUDY_UNIT_VALUES[resultsUnit] /
            (withDeprecation ? emissionSource.depreciationPeriod || 1 : 1) || '0',
          withDeprecation ? emissionSource.depreciationPeriod || '1' : ' ',
          isCAS(emissionSource) ? emissionSource.hectare || '1' : ' ',
          isCAS(emissionSource) ? emissionSource.duration || '1' : ' ',
          tResultUnits(resultsUnit),
          emissionSourceSD ? getQuality(getStandardDeviationRating(emissionSourceSD), tQuality) : '',
          emissionSource.emissionSourceTags.map((tag) => tag.name).join(', ') || '',
          emissionSource.value || '0',
          emissionFactor?.unit ? tUnit(emissionFactor.unit) : '',
          getQuality(getQualityRating(emissionSource), tQuality),
          emissionSource.comment || '',
          emissionFactor?.metaData?.title || t('noFactor'),
          emissionFactor ? getEmissionFactorValue(emissionFactor, environment) : '',
          emissionFactor?.unit ? `${tResultUnits(StudyResultUnit.K)}/${tUnit(emissionFactor.unit)}` : '',
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
  resultsUnit: StudyResultUnit,
  t: ReturnType<typeof useTranslations>,
  tCaracterisations: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnit: ReturnType<typeof useTranslations>,
  tResultUnits: ReturnType<typeof useTranslations>,
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
    type,
    environment,
  )

  const emptyFieldsCount = type === 'Study' ? 4 : type === 'Post' ? 3 : 2
  const emptyFields = (count: number) => Array(count).fill('')

  const emissionSourcesWithEmission = emissionSources.map((emissionSource) => ({
    ...emissionSource,
    ...getEmissionResults(emissionSource, environment),
  }))
  const totalEmissions = getEmissionSourcesTotalCo2(emissionSourcesWithEmission) / STUDY_UNIT_VALUES[resultsUnit]
  const totalRow = [t('total'), ...emptyFields(emptyFieldsCount + 1), totalEmissions].join(';')

  const qualities = emissionSources.map((emissionSource) => getStandardDeviation(emissionSource))
  const quality = getQuality(getStandardDeviationRating(sumQualities(qualities)), tQuality)
  const qualityRow = [t('quality'), ...emptyFields(emptyFieldsCount + 1), quality].join(';')

  const uncertainty = getEmissionSourcesGlobalUncertainty(emissionSourcesWithEmission)
  const uncertaintyRow = [
    t('uncertainty'),
    ...emptyFields(emptyFieldsCount),
    uncertainty[0] / STUDY_UNIT_VALUES[resultsUnit],
    uncertainty[1] / STUDY_UNIT_VALUES[resultsUnit],
  ].join(';')

  return [columns, ...rows, totalRow, qualityRow, uncertaintyRow].join('\n')
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
  tResultUnits: ReturnType<typeof useTranslations>,
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
    environment,
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
  tResultUnits: ReturnType<typeof useTranslations>,
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
    environment,
    'Study',
  )

  downloadCSV(csvContent, fileName)
}

const getHeadersForEnv = (environment: Environment) => {
  switch (environment) {
    case Environment.CUT:
      return resultsExportHeadersCut
    case Environment.BC:
    default:
      return resultsExportHeadersBase
  }
}
const getFormattedHeadersForEnv = (
  environment: Environment,
  traduction: ReturnType<typeof useTranslations>,
  traductionUnit: ReturnType<typeof useTranslations>,
  unit: StudyResultUnit,
) => {
  const headers = getHeadersForEnv(environment)

  return headers.map((header) =>
    header !== 'value' ? traduction(header) : traduction(header, { unit: traductionUnit(unit) }),
  )
}

export const formatConsolidatedStudyResultsForExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  tStudy: ReturnType<typeof useTranslations>,
  tExport: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tQuality: ReturnType<typeof useTranslations>,
  tUnits: ReturnType<typeof useTranslations>,
  validatedEmissionSourcesOnly?: boolean,
  environment: Environment = Environment.BC,
  type: ResultType = AdditionalResultTypes.CONSOLIDATED,
) => {
  const dataForExport = []
  const headersForEnv = getHeadersForEnv(environment)

  for (const site of siteList) {
    const resultList = computeResultsByPost(
      study,
      tPost,
      site.id,
      true,
      validatedEmissionSourcesOnly,
      environmentPostMapping[environment],
      environment,
      type,
    )
    dataForExport.push([site.name])
    dataForExport.push(
      getFormattedHeadersForEnv(
        type === AdditionalResultTypes.ENV_SPECIFIC_EXPORT ? environment : Environment.BC,
        tStudy,
        tUnits,
        study.resultsUnit,
      ),
    )

    for (const result of resultList) {
      const resultLine = [tPost(result.post) ?? '']

      if (headersForEnv.includes('uncertainty')) {
        resultLine.push(result.uncertainty ? tQuality(getStandardDeviationRating(result.uncertainty).toString()) : '')
      }
      dataForExport.push([...resultLine, Math.round((result.value ?? 0) / STUDY_UNIT_VALUES[study.resultsUnit])])
    }

    dataForExport.push([])
  }

  return {
    name: tExport(type),
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
  tUnits: ReturnType<typeof useTranslations>,
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
    dataForExport.push([tBeges('rule'), '', tBeges('ges', { unit: tUnits(study.resultsUnit) })])
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
        result.co2 / STUDY_UNIT_VALUES[study.resultsUnit],
        result.ch4 / STUDY_UNIT_VALUES[study.resultsUnit],
        result.n2o / STUDY_UNIT_VALUES[study.resultsUnit],
        result.other / STUDY_UNIT_VALUES[study.resultsUnit],
        result.total / STUDY_UNIT_VALUES[study.resultsUnit],
        result.co2b / STUDY_UNIT_VALUES[study.resultsUnit],
        result.uncertainty ? tQuality(getStandardDeviationRating(result.uncertainty).toString()) : '',
      ])
    }

    dataForExport.push([])
  }

  return { name: tExport('Beges'), data: dataForExport, options: sheetOptions }
}

export const formatBCResultsForCutExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  tExport: ReturnType<typeof useTranslations>,
  tPost: ReturnType<typeof useTranslations>,
  tStudy: ReturnType<typeof useTranslations>,
  studyUnitValues: Record<string, number>,
  environment: Environment,
) => {
  const data: (string | number)[][] = []

  data.push([tExport('bc.disclaimerExcel')])
  data.push([])

  for (const site of siteList) {
    const { computedResultsWithDep } = getResultsValues(study, tPost, site.id, false, environment, tStudy)
    const bilanCarboneEquivalent = convertCountToBilanCarbone(computedResultsWithDep)

    data.push([site.name])
    data.push([tExport('bc.category'), tExport('bc.emissions')])

    if (bilanCarboneEquivalent.length > 0) {
      let siteTotal = 0
      bilanCarboneEquivalent.forEach((result) => {
        const roundedValue = Math.round(result.value / studyUnitValues[study.resultsUnit])
        data.push([tPost(result.bilanCarboneCategory), roundedValue])
        siteTotal += roundedValue
      })
      data.push(['Total', siteTotal])
    }

    data.push([])
  }

  return {
    name: tExport('bc.title'),
    data,
    options: { '!cols': [{ wch: 35 }, { wch: 20 }] },
  }
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
  tUnits: ReturnType<typeof useTranslations>,
  environment: Environment = Environment.BC,
) => {
  const data = []

  const siteList = [
    { name: tOrga('allSites'), id: 'all' },
    ...study.sites.map((s) => ({ name: s.site.name, id: s.id })),
  ]

  const userSettings = await getUserSettings()
  const validatedEmissionSourcesOnly = userSettings.success
    ? userSettings.data?.validatedEmissionSourcesOnly
    : undefined

  if (environment !== Environment.BC) {
    const environmentResults = formatConsolidatedStudyResultsForExport(
      study,
      siteList,
      tStudy,
      tExport,
      tPost,
      tQuality,
      tUnits,
      validatedEmissionSourcesOnly,
      environment,
      AdditionalResultTypes.ENV_SPECIFIC_EXPORT,
    )

    if (environment === Environment.CUT) {
      environmentResults.data.unshift([])
      environmentResults.data.unshift([tExport('developmentFile')])
    }

    data.push(environmentResults)
  }

  if (hasAccessToBcExport(environment) || environment === Environment.BC) {
    const consolidatedResults = formatConsolidatedStudyResultsForExport(
      study,
      siteList,
      tStudy,
      tExport,
      tPost,
      tQuality,
      tUnits,
      validatedEmissionSourcesOnly,
      environment,
      AdditionalResultTypes.CONSOLIDATED,
    )
    data.push(consolidatedResults)
  }

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
        tUnits,
        validatedEmissionSourcesOnly,
      ),
    )
  }

  if (environment === Environment.CUT) {
    data.push(formatBCResultsForCutExport(study, siteList, tExport, tPost, tStudy, STUDY_UNIT_VALUES, environment))
  }

  const buffer = await prepareExcel(data)

  download([buffer], `${study.name}_results.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

export const getStudyParentOrganizationVersionId = async (
  studyId: string,
  userOrganizationVersionId: string | null,
) => {
  const study = await getStudyById(studyId, userOrganizationVersionId)
  if (!study) {
    throw Error("Study doesn't exist")
  }

  return study.organizationVersion.parentId || study.organizationVersion.id
}

export const getResultsValues = (
  study: FullStudy,
  tPost: ReturnType<typeof useTranslations>,
  studySite: string,
  validatedOnly: boolean,
  environment: Environment,
  tStudyResults: ReturnType<typeof useTranslations>,
  withDependencies: boolean = true,
) => {
  const computedResultsWithDep = computeResultsByPost(
    study,
    tPost,
    studySite,
    true,
    validatedOnly,
    environmentPostMapping[environment],
    environment,
  )

  const computedResultsWithoutDep = computeResultsByPost(
    study,
    tPost,
    studySite,
    false,
    validatedOnly,
    environmentPostMapping[environment],
    environment,
  )

  const computedResultsByTag = computeResultsByTag(
    study,
    studySite,
    withDependencies,
    validatedOnly,
    environment,
    tStudyResults,
  )

  const totalResult = computedResultsWithDep.find((result) => result.post === 'total')
  const total = totalResult?.value || 0
  const monetaryTotal = totalResult?.monetaryValue || 0
  const nonSpecificMonetaryTotal = totalResult?.nonSpecificMonetaryValue || 0

  const withDepValue = total / STUDY_UNIT_VALUES[study.resultsUnit]
  const withoutDepValue =
    (computedResultsWithoutDep.find((result) => result.post === 'total')?.value || 0) /
    STUDY_UNIT_VALUES[study.resultsUnit]

  const monetaryRatio = (monetaryTotal / total) * 100
  const nonSpecificMonetaryRatio = (nonSpecificMonetaryTotal / total) * 100

  return {
    computedResultsWithDep,
    computedResultsWithoutDep,
    withDepValue,
    withoutDepValue,
    monetaryRatio,
    nonSpecificMonetaryRatio,
    computedResultsByTag,
  }
}
