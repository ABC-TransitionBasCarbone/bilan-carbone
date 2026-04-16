import { EngagementActionTargets } from '@/constants/engagementActions'
import { resultsExportHeadersBase, resultsExportHeadersCut } from '@/constants/exports'
import type { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import { Translations } from '@/types/translation'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { getEmissionSourcesTotalCo2 } from '@/utils/emissionSources'
import { getGHGPRuleName } from '@/utils/ghgp'
import { getPost } from '@/utils/post'
import {
  calculateMonetaryRatio,
  formatEmissionFromNumber,
  formatEmissionValueForExport,
  hasDeprecationPeriod,
  isCAS,
  STUDY_UNIT_VALUES,
} from '@/utils/study'
import { formatDateFr } from '@/utils/time'
import type { ExportRule } from '@repo/db-common'
import { EmissionFactorBase, Environment, Export, StudyResultUnit, SubPost } from '@repo/db-common/enums'
import dayjs from 'dayjs'
import type { ResultType } from '../types/study.types'
import { AdditionalResultTypes, BaseResultsBySite, ResultsByPost } from '../types/study.types'
import { getEmissionResults, getEmissionSourceEmission } from './emissionSource'
import { download } from './file'
import { hasAccessToBcExport } from './permissions/environment'
import {
  convertSimplifiedEnvToBilanCarbone,
  convertTiltSubPostToBCSubPost,
  environmentPostMapping,
  Post,
  subPostBCToSubPostTiltMapping,
} from './posts'
import { isSimplifiedEnvironment } from './publicodes/simplifiedPublicodesConfig'
import { rulesSpans as begesRulesSpans, computeBegesResult } from './results/beges'
import { computeResultsByPostFromEmissionSources, computeResultsByTag } from './results/consolidated'
import { PostInfos } from './results/exports'
import { computeGHGPResult, rulesSpans as ghgpRulesSpans } from './results/ghgp'
import { filterWithDependencies } from './results/utils'
import { EmissionFactorWithMetaData, getEmissionFactorsByIds } from './serverFunctions/emissionFactor'
import { prepareExcel } from './serverFunctions/file'
import { getUserSettings } from './serverFunctions/user'
import {
  getConfidenceInterval,
  getEmissionSourcesConfidenceInterval,
  getQualitativeUncertaintyForEmissionSources,
  getQualitativeUncertaintyFromQuality,
  getQualitativeUncertaintyFromSquaredStandardDeviation,
  getSquaredStandardDeviationForEmissionSource,
} from './uncertainty'

const getQuality = (quality: ReturnType<typeof getQualitativeUncertaintyFromQuality>, t: Translations) => {
  return quality === null ? t('unknown') : t(quality.toString())
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
  return download(['\ufeff', csvContent], fileName, 'csv')
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
  traduction: Translations,
  traductionUnit: Translations,
  unit: StudyResultUnit,
) => {
  const headers = getHeadersForEnv(environment)

  return headers.map((header) =>
    header !== 'value'
      ? traduction(header)
      : environment === Environment.CLICKSON
        ? `${traduction(header)} (tCO2e)`
        : traduction(header, { unit: traductionUnit(unit) }),
  )
}

const handleLine = (
  headersForEnv: string[],
  result: ResultsByPost,
  tQuality: Translations,
  resultsUnit: StudyResultUnit,
) => {
  const resultLine = []
  if (headersForEnv.includes('uncertainty')) {
    resultLine.push(
      result.squaredStandardDeviation
        ? tQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(result.squaredStandardDeviation).toString())
        : '',
    )
  }

  resultLine.push(formatEmissionValueForExport(result.value ?? 0, resultsUnit))

  if (headersForEnv.includes('confidenceIntervalTitle')) {
    const confidenceInterval = getConfidenceInterval(result.value, result.squaredStandardDeviation)

    resultLine.push(
      `[${formatEmissionFromNumber(confidenceInterval[0], resultsUnit)};${formatEmissionFromNumber(confidenceInterval[1], resultsUnit)}]`,
    )
  }

  return resultLine
}

export const formatConsolidatedStudyResultsForExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  tStudy: Translations,
  tExport: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnits: Translations,
  validatedEmissionSourcesOnly?: boolean,
  environment: Environment = Environment.BC,
  type: ResultType = AdditionalResultTypes.CONSOLIDATED,
) => {
  const dataForExport = []
  const headersForEnv = getHeadersForEnv(environment)

  for (const site of siteList) {
    const resultList = computeResultsByPostFromEmissionSources(
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
      dataForExport.push([result.label, '', ...handleLine(headersForEnv, result, tQuality, study.resultsUnit)])

      for (const subPostResult of result.children) {
        dataForExport.push([
          '',
          subPostResult.label,
          ...handleLine(headersForEnv, subPostResult, tQuality, study.resultsUnit),
        ])
      }
    }

    dataForExport.push([])
  }

  return {
    name: tExport(type),
    data: dataForExport,
    options: { '!cols': [{ wch: 30 }, { wch: 15 }, { wch: 20 }] },
  }
}
interface IExportData {
  rulesSpans: Record<string, number>
  gasCols: (t: Translations) => string[]
  gasFields: (keyof PostInfos)[]
  getRuleName: (rule: string) => string
  getCategoryName: (cateogy: string, t: Translations) => string
}

const exportsData: Partial<Record<Export, IExportData>> = {
  [Export.Beges]: {
    rulesSpans: begesRulesSpans,
    gasCols: (t: Translations) => ['CO2', 'CH4', 'N2O', t('other')],
    gasFields: ['co2', 'ch4', 'n2o', 'other', 'total', 'co2b'] as const,
    getRuleName: (rule: string) => rule,
    getCategoryName: (category: string, t: Translations) => `${category}. ${t(`category.${category}`)}`,
  },
  [Export.GHGP]: {
    rulesSpans: ghgpRulesSpans,
    gasCols: () => ['CO2', 'CH4', 'N2O', 'HFC', 'PFC', 'SF6'],
    gasFields: ['co2', 'ch4', 'n2o', 'hfc', 'pfc', 'sf6', 'total', 'co2b'] as const,
    getRuleName: getGHGPRuleName,
    getCategoryName: (category: string, t: Translations) => t(`category.${category}`),
  },
}

type Merge = {
  s: { c: number; r: number }
  e: { c: number; r: number }
}

const buildMerges = (rulesSpans: Record<number, number>, startRow: number, column = 0): Merge[] => {
  const merges: Merge[] = []
  let currentRow = startRow

  for (const key of Object.keys(rulesSpans).sort((a, b) => Number(a) - Number(b))) {
    const span = rulesSpans[Number(key)]

    merges.push({
      s: { c: column, r: currentRow },
      e: { c: column, r: currentRow + span - 1 },
    })

    currentRow += span
  }

  return merges
}

const buildRowMerge = (row: number, startCol: number, span: number): Merge => ({
  s: { r: row, c: startCol },
  e: { r: row, c: startCol + span - 1 },
})

export const formatStudyExportResultsForExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  tStudy: Translations,
  tQuality: Translations,
  tSpecificExport: Translations,
  tUnits: Translations,
  exportType: Export,
  exportName: string,
  getResults: (siteId: string) => PostInfos[],
) => {
  const data = exportsData[exportType]
  if (!data) {
    return { name: tSpecificExport(exportType), data: [], options: { '!merges': [], '!cols': [] } }
  }
  const rulesSpans = data.rulesSpans
  delete rulesSpans.total
  const length = Object.values(rulesSpans).reduce((res, rule) => res + rule, 0) + 5
  const dataForExport = []

  const sheetOptions: { '!merges': object[]; '!cols': object[] } = {
    '!merges': [],
    '!cols': [
      { wch: 50 },
      { wch: 60 },
      ...Array.from({ length: data.gasFields.length }, () => ({ wch: 15 })),
      { wch: 20 },
    ],
  }

  for (let i = 0; i < siteList.length; i++) {
    const site = siteList[i]
    const resultList = getResults(site.id)
    const gasFields = data.gasFields

    // Merge cells
    sheetOptions['!merges'].push(...buildMerges(rulesSpans, 3 + i * length))

    dataForExport.push([site.name])

    const rowIndex = dataForExport.length
    const totalCols = gasFields.length + 2
    dataForExport.push(Array(totalCols).fill(''))
    dataForExport[rowIndex][2] = tSpecificExport('ges', { unit: tUnits(study.resultsUnit) })
    sheetOptions['!merges'].push(buildRowMerge(rowIndex, 2, totalCols))

    dataForExport.push([
      tSpecificExport('category.title'),
      tSpecificExport('post.title'),
      ...data.gasCols(tSpecificExport),
      tSpecificExport('total'),
      'CO2b',
      tSpecificExport('uncertainty'),
      tStudy('confidenceIntervalTitle'),
    ])

    for (const result of resultList) {
      const category = result.rule.split('.')[0]
      const rule = result.rule
      let post
      if (rule === 'total') {
        post = tSpecificExport('total')
      } else if (result.rule.includes('.total')) {
        post = tSpecificExport('subTotal')
      } else {
        post = `${data.getRuleName(rule)}. ${tSpecificExport(`post.${rule}`)}`
      }

      const gasValues = gasFields.map((field) =>
        formatEmissionValueForExport((result[field] as number) || 0, study.resultsUnit),
      )

      const confidenceInterval = getConfidenceInterval(result.total, result.squaredStandardDeviation)

      dataForExport.push([
        category === 'total' ? '' : data.getCategoryName(category, tSpecificExport),
        post,
        ...gasValues,
        result.squaredStandardDeviation
          ? tQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(result.squaredStandardDeviation).toString())
          : '',
        `[${formatEmissionFromNumber(confidenceInterval[0], study.resultsUnit)};${formatEmissionFromNumber(confidenceInterval[1], study.resultsUnit)}]`,
      ])
    }

    dataForExport.push([])
  }

  return { name: exportName, data: dataForExport, options: sheetOptions }
}

const formatBaseResultsToBCExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  computedResults: BaseResultsBySite,
  tExport: Translations,
  tPost: Translations,
) => {
  const data: (string | number)[][] = []
  data.push([tExport('bc.disclaimerExcel1')])
  data.push([tExport('bc.disclaimerExcel2')])
  data.push([tExport('bc.disclaimerExcel3')])
  data.push([tExport('bc.disclaimerExcel4')])
  data.push([tExport('bc.disclaimerExcel5')])
  data.push([tExport('bc.disclaimerExcel6')])
  data.push([])

  for (const site of siteList) {
    const results = site.id === 'all' ? computedResults.aggregated : computedResults.bySite[site.id]
    // TODO: use a more generic conversion function to be used by all simplified environments
    const bilanCarboneEquivalent = convertSimplifiedEnvToBilanCarbone(results ?? [])

    data.push([site.name])
    data.push([tExport('bc.category'), tExport('bc.emissions')])

    let siteTotal = 0
    Object.entries(bilanCarboneEquivalent).forEach(([result, value]) => {
      const roundedValue = Math.round(value / STUDY_UNIT_VALUES[study.resultsUnit])
      data.push([tPost(result), roundedValue])
      siteTotal += roundedValue
    })
    data.push(['Total', siteTotal])
  }

  data.push([])

  return {
    name: tExport('bc.title'),
    data,
    options: {
      '!cols': [{ wch: 35 }, { wch: 20 }],
      '!merges': [{ s: { c: 0, r: 0 }, e: { c: 20, r: 0 } }],
    },
  }
}

export const formatComputedResultsForExport = (
  study: FullStudy,
  siteList: { name: string; id: string }[],
  computedResults: BaseResultsBySite,
  tStudy: Translations,
  tExport: Translations,
  tUnits: Translations,
  environment: Environment,
) => {
  const dataForExport: (string | number)[][] = []
  const formattedHeaders = getFormattedHeadersForEnv(environment, tStudy, tUnits, study.resultsUnit)

  for (const site of siteList) {
    dataForExport.push([site.name])
    dataForExport.push(formattedHeaders)
    const results = site.id === 'all' ? computedResults.aggregated : computedResults.bySite[site.id]

    for (const result of results) {
      dataForExport.push([result.label, '', formatEmissionValueForExport(result.value ?? 0, study.resultsUnit)])

      if (result.post !== 'total') {
        for (const subPostResult of result.children) {
          dataForExport.push([
            '',
            subPostResult.label,
            formatEmissionValueForExport(subPostResult.value ?? 0, study.resultsUnit),
          ])
        }
      }
    }
  }

  dataForExport.push([])

  return {
    name: tExport(AdditionalResultTypes.ENV_SPECIFIC_EXPORT),
    data: dataForExport,
    options: { '!cols': [{ wch: 30 }, { wch: 15 }, { wch: 20 }] },
  }
}

export const downloadStudyResults = async (
  study: FullStudy,
  begesRules: ExportRule[],
  ghgpRules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  tStudy: Translations,
  tExport: Translations,
  tPost: Translations,
  tOrga: Translations,
  tQuality: Translations,
  tBeges: Translations,
  tGHGP: Translations,
  tUnits: Translations,
  tBase: Translations,
  environment: Environment = Environment.BC,
  computedResults?: BaseResultsBySite,
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
    // Use precomputed results from publicodes if available (for simplified environments)
    if (computedResults !== undefined) {
      const environmentResults = formatComputedResultsForExport(
        study,
        siteList,
        computedResults,
        tStudy,
        tExport,
        tUnits,
        environment,
      )
      data.push(environmentResults)
    } else {
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
      data.push(environmentResults)
    }
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

  if (study.exports?.types.includes(Export.Beges)) {
    data.push(
      formatStudyExportResultsForExport(
        study,
        siteList,
        tStudy,
        tQuality,
        tBeges,
        tUnits,
        Export.Beges,
        tExport(Export.Beges),
        (siteId: string) =>
          computeBegesResult(
            study,
            begesRules,
            emissionFactorsWithParts,
            siteId,
            true,
            validatedEmissionSourcesOnly,
            environment,
          ),
      ),
    )
  }

  if (study.exports?.types.includes(Export.GHGP)) {
    data.push(
      formatStudyExportResultsForExport(
        study,
        siteList,
        tStudy,
        tQuality,
        tGHGP,
        tUnits,
        Export.GHGP,
        `${tExport(Export.GHGP)} - ${tBase(EmissionFactorBase.LocationBased)}`,
        (siteId: string) =>
          computeGHGPResult(
            study,
            ghgpRules,
            emissionFactorsWithParts,
            siteId,
            true,
            validatedEmissionSourcesOnly,
            EmissionFactorBase.LocationBased,
            environment,
          ),
      ),
    )
    data.push(
      formatStudyExportResultsForExport(
        study,
        siteList,
        tStudy,
        tQuality,
        tGHGP,
        tUnits,
        Export.GHGP,
        `${tExport(Export.GHGP)} - ${tBase(EmissionFactorBase.MarketBased)}`,
        (siteId: string) =>
          computeGHGPResult(
            study,
            ghgpRules,
            emissionFactorsWithParts,
            siteId,
            true,
            validatedEmissionSourcesOnly,
            EmissionFactorBase.MarketBased,
            environment,
          ),
      ),
    )
  }

  if (environment === Environment.CUT && computedResults) {
    data.push(formatBaseResultsToBCExport(study, siteList, computedResults, tExport, tPost))
  }

  const buffer = await prepareExcel(data)

  download([buffer], `${study.name}_results.xlsx`, 'xlsx')
}

export const getDetailedEmissionResults = (
  study: FullStudy,
  tPost: Translations,
  studySite: string,
  validatedOnly: boolean,
  environment: Environment,
  tStudyResults: Translations,
  withDependencies: boolean = true,
  type?: ResultType,
) => {
  const computedResultsWithDep = computeResultsByPostFromEmissionSources(
    study,
    tPost,
    studySite,
    true,
    validatedOnly,
    environmentPostMapping[environment],
    environment,
    type,
  )

  const computedResultsWithoutDep = computeResultsByPostFromEmissionSources(
    study,
    tPost,
    studySite,
    false,
    validatedOnly,
    environmentPostMapping[environment],
    environment,
    type,
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

  const monetaryRatio = calculateMonetaryRatio(monetaryTotal, total)
  const nonSpecificMonetaryRatio = calculateMonetaryRatio(nonSpecificMonetaryTotal, total)

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

export const getStudyTotalCo2Emissions = (
  study: FullStudy,
  withDependencies: boolean = true,
  validatedOnly: boolean = true,
) => {
  const environment = study.organizationVersion.environment
  let filteredSources = withDependencies
    ? study.emissionSources
    : study.emissionSources.filter((source) => filterWithDependencies(source.subPost, withDependencies))

  if (validatedOnly) {
    filteredSources = filteredSources.filter((source) => source.validated)
  }

  const emissionSourcesWithEmission = filteredSources.map((source) => ({
    ...source,
    ...getEmissionResults(source, environment),
  }))

  const totalCo2InKg = getEmissionSourcesTotalCo2(emissionSourcesWithEmission)
  return totalCo2InKg / STUDY_UNIT_VALUES[study.resultsUnit]
}

export const getTransEnvironmentSubPost = (source: Environment, target: Environment, subPost: SubPost) => {
  if (source === target) {
    return subPost
  }
  if (source === Environment.BC && target === Environment.TILT) {
    switch (subPost) {
      case SubPost.UtilisationEnResponsabilite:
      case SubPost.UtilisationEnDependance:
        return SubPost.UtilisationEnDependanceConsommationDeBiens
      case SubPost.Equipements:
        return SubPost.EquipementsDesSalaries
      case SubPost.Informatique:
        return SubPost.ParcInformatiqueDesSalaries
      default: {
        const subPosts = subPostBCToSubPostTiltMapping[subPost]
        if (!subPosts) {
          return undefined
        }
        return subPosts[0]
      }
    }
  } else if (source === Environment.TILT && target === Environment.BC) {
    return convertTiltSubPostToBCSubPost(subPost)
  } else {
    return undefined
  }
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
