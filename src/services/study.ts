import { resultsExportHeadersBase, resultsExportHeadersCut } from '@/constants/exports'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy, getStudyById } from '@/db/study'
import { Translations } from '@/types/translation'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { getPost } from '@/utils/post'
import { formatValueForExport, hasDeprecationPeriod, isCAS, STUDY_UNIT_VALUES } from '@/utils/study'
import { Environment, Export, ExportRule, Level, StudyResultUnit, SubPost } from '@prisma/client'
import dayjs from 'dayjs'
import {
  canBeValidated,
  getEmissionResults,
  getEmissionSourceEmission,
  getEmissionSourcesTotalCo2,
  getStandardDeviation,
} from './emissionSource'
import { download } from './file'
import { hasAccessToBcExport } from './permissions/environment'
import { StudyWithoutDetail } from './permissions/study'
import {
  convertCountToBilanCarbone,
  convertTiltSubPostToBCSubPost,
  environmentPostMapping,
  Post,
  subPostBCToSubPostTiltMapping,
} from './posts'
import { computeBegesResult } from './results/beges'
import { computeResultsByPost, computeResultsByTag, ResultsByPost } from './results/consolidated'
import { filterWithDependencies } from './results/utils'
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

const getQuality = (quality: ReturnType<typeof getQualityRating>, t: Translations) => {
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

export const hasSufficientLevel = (userLevel: Level | null, targetLevel: Level) =>
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
  t: Translations,
  tCaracterisations: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnit: Translations,
  tResultUnits: Translations,
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

      const withDeprecation = hasDeprecationPeriod(emissionSource.subPost)

      return initCols
        .concat([
          emissionSource.validated ? t('yes') : t('no'),
          emissionSource.name || '',
          emissionSource.caracterisation ? tCaracterisations(emissionSource.caracterisation) : '',
          formatValueForExport(getEmissionSourceEmission(emissionSource, environment) || 0),
          withDeprecation ? emissionSource.depreciationPeriod || '1' : ' ',
          isCAS(emissionSource) ? emissionSource.hectare || '1' : ' ',
          isCAS(emissionSource) ? emissionSource.duration || '1' : ' ',
          tResultUnits(resultsUnit),
          emissionSourceSD ? getQuality(getStandardDeviationRating(emissionSourceSD), tQuality) : '',
          emissionSource.emissionSourceTags.map((emissionSourceTag) => emissionSourceTag.tag.name).join(', ') || '',
          emissionSource.value?.toLocaleString('fr-FR', { useGrouping: false }) || '0',
          emissionFactor?.unit ? tUnit(emissionFactor.unit, { count: 1 }) : '',
          getQuality(getQualityRating(emissionSource), tQuality),
          emissionSource.comment || '',
          emissionFactor?.metaData?.title || t('noFactor'),
          emissionFactor
            ? getEmissionFactorValue(emissionFactor, environment).toLocaleString('fr-FR', { useGrouping: false })
            : '',
          emissionFactor?.unit ? `${tResultUnits(StudyResultUnit.K)}/${tUnit(emissionFactor.unit, { count: 1 })}` : '',
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
  const totalEmissions = formatValueForExport(
    getEmissionSourcesTotalCo2(emissionSourcesWithEmission) / STUDY_UNIT_VALUES[resultsUnit],
  )
  const totalRow = [t('total'), ...emptyFields(emptyFieldsCount + 1), totalEmissions].join(';')

  const qualities = emissionSources.map((emissionSource) => getStandardDeviation(emissionSource))
  const quality = getQuality(getStandardDeviationRating(sumQualities(qualities)), tQuality)
  const qualityRow = [t('quality'), ...emptyFields(emptyFieldsCount + 1), quality].join(';')

  const uncertainty = getEmissionSourcesGlobalUncertainty(emissionSourcesWithEmission)
  const uncertaintyRow = [
    t('uncertainty'),
    ...emptyFields(emptyFieldsCount),
    formatValueForExport(uncertainty[0] / STUDY_UNIT_VALUES[resultsUnit]),
    formatValueForExport(uncertainty[1] / STUDY_UNIT_VALUES[resultsUnit]),
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
  t: Translations,
  tCaracterisations: Translations,
  tPost: Translations,
  tQuality: Translations,
  tUnit: Translations,
  tResultUnits: Translations,
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
  traduction: Translations,
  traductionUnit: Translations,
  unit: StudyResultUnit,
) => {
  const headers = getHeadersForEnv(environment)

  return headers.map((header) =>
    header !== 'value' ? traduction(header) : traduction(header, { unit: traductionUnit(unit) }),
  )
}

const handleLine = (
  headersForEnv: string[],
  result: ResultsByPost,
  tQuality: Translations,
  resultsUnits: StudyResultUnit,
) => {
  const resultLine = []
  if (headersForEnv.includes('uncertainty')) {
    resultLine.push(result.uncertainty ? tQuality(getStandardDeviationRating(result.uncertainty).toString()) : '')
  }

  return [...resultLine, formatValueForExport((result.value ?? 0) / STUDY_UNIT_VALUES[resultsUnits])]
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

export const formatBegesStudyResultsForExport = (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  siteList: { name: string; id: string }[],
  tExport: Translations,
  tQuality: Translations,
  tBeges: Translations,
  tUnits: Translations,
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

    const gasFields = ['co2', 'ch4', 'n2o', 'other', 'total', 'co2b'] as const

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

      const gasValues = gasFields.map((field) =>
        formatValueForExport(result[field] / STUDY_UNIT_VALUES[study.resultsUnit]),
      )

      dataForExport.push([
        category === 'total' ? '' : `${category}. ${tBeges(`category.${category}`)}`,
        post,
        ...gasValues,
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
  tExport: Translations,
  tPost: Translations,
  tStudy: Translations,
  studyUnitValues: Record<string, number>,
  environment: Environment,
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
    const { computedResultsWithDep } = getDetailedEmissionResults(study, tPost, site.id, false, environment, tStudy)
    const bilanCarboneEquivalent = convertCountToBilanCarbone(computedResultsWithDep)

    data.push([site.name])
    data.push([tExport('bc.category'), tExport('bc.emissions')])

    let siteTotal = 0
    Object.entries(bilanCarboneEquivalent).forEach(([result, value]) => {
      const roundedValue = Math.round(value / studyUnitValues[study.resultsUnit])
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

export const downloadStudyResults = async (
  study: FullStudy,
  rules: ExportRule[],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  tStudy: Translations,
  tExport: Translations,
  tPost: Translations,
  tOrga: Translations,
  tQuality: Translations,
  tBeges: Translations,
  tUnits: Translations,
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

  download([buffer], `${study.name}_results.xlsx`, 'xlsx')
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
  const computedResultsWithDep = computeResultsByPost(
    study,
    tPost,
    studySite,
    true,
    validatedOnly,
    environmentPostMapping[environment],
    environment,
    type,
  )

  const computedResultsWithoutDep = computeResultsByPost(
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
