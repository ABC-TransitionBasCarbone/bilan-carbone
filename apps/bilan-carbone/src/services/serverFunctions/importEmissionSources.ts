'use server'

import { createEmissionSourcesOnStudy } from '@/db/emissionSource'
import { FullStudy, getStudyById } from '@/db/study'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { Post, subPostsByPost } from '@/services/posts'
import { AccountWithUser } from '@/types/account.types'
import {
  ImportEmissionSourceError,
  ImportEmissionSourcesResult,
  ImportEmissionSourceWarning,
  PreviewEmissionSourceRow,
  PreviewEmissionSourcesResult,
} from '@/types/importEmissionSources.types'
import { findEmissionFactorMatch } from '@/utils/findEmissionFactor.utils'
import { parseEmissionSourcesFile } from '@/utils/importEmissionSources.utils'
import { getPost } from '@/utils/post'
import { formatEmissionValueForExport } from '@/utils/study'
import { getBcTranslations, getSingularForm } from '@/utils/translation.utils'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@abc-transitionbascarbone/db-common/enums'
import { revalidatePath } from 'next/cache'
import xlsx from 'node-xlsx'
import { canBeValidated, getEmissionSourceEmission } from '../emissionSource'
import { getAuthenticatedAccount } from '../permissions/account.permissions'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasStudyBasicRights } from '../permissions/emissionSource'
import { canReadStudy } from '../permissions/study'
import {
  getQualitativeUncertaintyFromQuality,
  getQualitativeUncertaintyFromSquaredStandardDeviation,
  getSpecificEmissionFactorQuality,
  getSquaredStandardDeviationForEmissionSource,
} from '../uncertainty'
import { getEmissionFactorsByIds } from './emissionFactor'

const TOTAL_EXCEL_COLS = 35

async function getStudyOrThrow(studyId: string, account: AccountWithUser): Promise<FullStudy> {
  const study = await getStudyById(studyId, account.organizationVersionId)
  if (!study) {
    throw new Error(NOT_AUTHORIZED)
  }
  return study
}

export async function previewEmissionSourcesFromFile(
  file: File,
  studyId: string,
): Promise<PreviewEmissionSourcesResult> {
  const account = await getAuthenticatedAccount()

  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseEmissionSourcesFile(buffer, locale)

  if (!result.success) {
    return result
  }

  const bc = getBcTranslations(locale)
  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const unitTranslations = bc.units as Record<string, string>
  const translateUnitLabel = (unit: string | undefined) => (unit ? getSingularForm(unitTranslations[unit] ?? unit) : '')

  const rows: PreviewEmissionSourceRow[] = result.rows.map((row) => {
    const post = getPost(row.subPost)
    return {
      site: row.siteName,
      post: post ? (postTranslations[post] ?? post) : '',
      subPost: postTranslations[row.subPost] ?? row.subPost,
      name: row.name,
      value: row.value !== undefined ? String(row.value) : '',
      unit: row.unit ?? '',
      emissionFactorId: row.emissionFactorId ?? '',
      emissionFactorName: row.emissionFactorName ?? '',
      emissionFactorValue: row.emissionFactorValue !== undefined ? String(row.emissionFactorValue) : '',
      emissionFactorUnit: translateUnitLabel(row.emissionFactorUnit),
      type: row.type ?? '',
      tag: row.tag ?? '',
      source: row.source ?? '',
      reliability: row.reliability !== undefined ? String(row.reliability) : '',
      technicalRepresentativeness:
        row.technicalRepresentativeness !== undefined ? String(row.technicalRepresentativeness) : '',
      geographicRepresentativeness:
        row.geographicRepresentativeness !== undefined ? String(row.geographicRepresentativeness) : '',
      temporalRepresentativeness:
        row.temporalRepresentativeness !== undefined ? String(row.temporalRepresentativeness) : '',
      completeness: row.completeness !== undefined ? String(row.completeness) : '',
    }
  })

  return { success: true, rows }
}

export async function importEmissionSourcesFromFile(
  file: File,
  studyId: string,
  forceImport = false,
): Promise<ImportEmissionSourcesResult> {
  const account = await getAuthenticatedAccount()

  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseEmissionSourcesFile(buffer, locale)

  if (!result.success) {
    return result
  }

  const siteMap = new Map<string, string>()
  for (const studySite of study.sites) {
    const siteName = studySite.site?.name
    if (siteName) {
      siteMap.set(siteName.toLowerCase(), studySite.id)
    }
  }

  const organizationId = study.organizationVersion.organization?.id ?? ''
  const versionIds = study.emissionFactorVersions.map((v) => v.importVersionId)
  const bc = getBcTranslations(locale)
  const unitTranslations = bc.units as Record<string, string>
  const translateUnit = (unit: string | undefined) =>
    unit ? getSingularForm(unitTranslations[unit] ?? unit) : undefined

  const rowErrors: ImportEmissionSourceError[] = []
  const rowWarnings: ImportEmissionSourceWarning[] = []
  const validRows: Array<{
    studySiteId: string
    studyId: string
    subPost: SubPost
    name: string
    emissionFactorId?: string
    value?: number
    type?: EmissionSourceType
    caracterisation?: EmissionSourceCaracterisation
    source?: string
    reliability?: number
    technicalRepresentativeness?: number
    geographicRepresentativeness?: number
    temporalRepresentativeness?: number
    completeness?: number
    comment?: string
  }> = []

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i]
    const lineNum = i + 2

    const studySiteId = siteMap.get(row.siteName.toLowerCase())
    if (!studySiteId) {
      rowErrors.push({ line: lineNum, key: 'siteNotFound', value: row.siteName })
      continue
    }

    const ef = await findEmissionFactorMatch(
      row.emissionFactorId,
      row.emissionFactorName,
      row.emissionFactorValue,
      row.emissionFactorUnit,
      locale,
      organizationId,
      versionIds,
    )

    let emissionFactorId: string | undefined
    let efUnit: string | undefined
    if (!ef) {
      rowWarnings.push({
        type: 'efNotFound',
        line: lineNum,
        sourceName: row.name,
        searchedName: row.emissionFactorName,
        searchedValue: row.emissionFactorValue,
        searchedUnit: row.emissionFactorUnit,
      })
    } else if (ef.matchType === 'nameAmbiguous') {
      rowWarnings.push({
        type: 'efNotFound',
        line: lineNum,
        sourceName: row.name,
        searchedName: row.emissionFactorName,
        searchedValue: row.emissionFactorValue,
        searchedUnit: row.emissionFactorUnit,
        candidates: ef.candidates.map((c) => ({
          foundTitle: c.foundTitle,
          foundValue: c.foundValue,
          foundUnit: translateUnit(c.foundUnit),
        })),
      })
    } else if (ef.matchType !== 'exact') {
      rowWarnings.push({
        type: 'efNotFound',
        line: lineNum,
        sourceName: row.name,
        searchedName: row.emissionFactorName,
        searchedValue: row.emissionFactorValue,
        searchedUnit: row.emissionFactorUnit,
        foundTitle: ef.foundTitle,
        foundValue: ef.foundValue,
        foundUnit: translateUnit(ef.foundUnit),
      })
      emissionFactorId = ef.id
      efUnit = ef.foundUnit
    } else {
      emissionFactorId = ef.id
      efUnit = ef.foundUnit
    }

    let validated = row.validated
    if (validated) {
      const canValidate = canBeValidated(
        {
          name: row.name,
          type: row.type ?? null,
          value: row.value ?? null,
          emissionFactorId: emissionFactorId ?? null,
          caracterisation: row.caracterisation ?? null,
          subPost: row.subPost,
          constructionYear: null,
          depreciationPeriod: null,
          hectare: null,
          duration: null,
        },
        study,
        { unit: efUnit },
        study.organizationVersion.environment,
      )
      if (!canValidate) {
        validated = false
        rowWarnings.push({ type: 'validationSkipped', line: lineNum, sourceName: row.name })
      }
    }

    validRows.push({
      studySiteId,
      studyId,
      subPost: row.subPost,
      name: row.name,
      ...(emissionFactorId ? { emissionFactorId } : {}),
      ...(row.value !== undefined ? { value: row.value } : {}),
      ...(row.type ? { type: row.type } : {}),
      ...(row.caracterisation ? { caracterisation: row.caracterisation } : {}),
      ...(row.source ? { source: row.source } : {}),
      ...(row.reliability !== undefined ? { reliability: row.reliability } : {}),
      ...(row.technicalRepresentativeness !== undefined
        ? { technicalRepresentativeness: row.technicalRepresentativeness }
        : {}),
      ...(row.geographicRepresentativeness !== undefined
        ? { geographicRepresentativeness: row.geographicRepresentativeness }
        : {}),
      ...(row.temporalRepresentativeness !== undefined
        ? { temporalRepresentativeness: row.temporalRepresentativeness }
        : {}),
      ...(row.completeness !== undefined ? { completeness: row.completeness } : {}),
      ...(row.comment ? { comment: row.comment } : {}),
      ...(row.feComment ? { feComment: row.feComment } : {}),
      ...(validated !== undefined ? { validated } : {}),
    })
  }

  if (rowErrors.length > 0) {
    return { success: false, errors: rowErrors }
  }

  if (rowWarnings.length > 0 && !forceImport) {
    return { success: false, warnings: rowWarnings }
  }

  await createEmissionSourcesOnStudy(validRows)
  revalidatePath(`/etudes/${studyId}/comptabilisation/saisie-des-donnees`)

  return { success: true, errors: [], warnings: [] }
}

function buildEmissionSourcesSheet(study: FullStudy, locale: LocaleType, dataRows: (string | number)[][]): ArrayBuffer {
  const bc = getBcTranslations(locale)
  const modal = (bc.study as Record<string, unknown>)?.importEmissionSourcesModal as Record<string, string> | undefined
  const t = (key: string) => modal?.[key] ?? key

  const DA_START = 6
  const DA_END = 18
  const FE_START = 19
  const FE_END = 31
  const BC_START = 32
  const BC_END = 34

  const empty = (n: number) => Array(n).fill('')

  const orgName = study.organizationVersion.organization?.name ?? ''
  const studyDate = study.startDate ? study.startDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') : ''

  const metaRow: (string | number)[] = [t('exportOrganization'), orgName, ...empty(TOTAL_EXCEL_COLS - 2)]
  const dateRow: (string | number)[] = [t('exportDate'), studyDate, ...empty(TOTAL_EXCEL_COLS - 2)]
  const blankRow: (string | number)[] = empty(TOTAL_EXCEL_COLS)
  const groupRow: (string | number)[] = [
    ...empty(DA_START),
    t('groupActivityData'),
    ...empty(DA_END - DA_START),
    t('groupEmissionFactor'),
    ...empty(FE_END - FE_START),
    '',
    t('groupBcSpecific'),
    ...empty(BC_END - BC_START),
  ]
  const headerRow: (string | number)[] = getEmissionSourcesHeaderRow(t)

  // Row indices: 0=meta, 1=date, 2=blank, 3=groupRow, 4=headerRow, 5+=data
  const GROUP_ROW_INDEX = 3
  const merges = [
    { s: { r: GROUP_ROW_INDEX, c: DA_START }, e: { r: GROUP_ROW_INDEX, c: DA_END } },
    { s: { r: GROUP_ROW_INDEX, c: FE_START }, e: { r: GROUP_ROW_INDEX, c: FE_END } },
    { s: { r: GROUP_ROW_INDEX, c: BC_START }, e: { r: GROUP_ROW_INDEX, c: BC_END } },
  ]

  const sheetName = t('sheetName')
  const sheetData = [metaRow, dateRow, blankRow, groupRow, headerRow, ...dataRows]
  const buffer = xlsx.build([{ name: sheetName, data: sheetData, options: { '!merges': merges } }])
  const arrayBuffer = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(arrayBuffer)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i]
  }
  return arrayBuffer
}

export async function getImportEmissionSourcesTemplate(
  studyId: string,
  post?: Post,
  siteId?: string,
): Promise<ArrayBuffer> {
  const account = await getAuthenticatedAccount()
  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const bc = getBcTranslations(locale)

  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>

  const modal = (bc.study as Record<string, unknown>)?.importEmissionSourcesModal as Record<string, string> | undefined
  const t = (key: string) => modal?.[key] ?? key

  const studySite = siteId ? study.sites.find((s) => s.site?.id === siteId) : study.sites[0]
  const siteName = studySite?.site?.name ?? ''
  const postLabel = post ? (postTranslations[post] ?? post) : ''

  const subPostTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const unitTranslations = bc.units as Record<string, string>
  const typeTranslations = (bc.emissionSource as Record<string, unknown>).type as Record<string, string>

  const exampleRow: (string | number)[] = Array(TOTAL_EXCEL_COLS).fill('')
  exampleRow[0] = siteName
  exampleRow[1] = postTranslations['IntrantsBiensEtMatieres'] ?? 'IntrantsBiensEtMatieres'
  exampleRow[2] = subPostTranslations['MetauxPlastiquesEtVerre'] ?? 'MetauxPlastiquesEtVerre'
  exampleRow[3] = t('examplePrefix') + t('exampleName')
  exampleRow[6] = 1000
  exampleRow[7] = getSingularForm(unitTranslations['TON'] ?? 'TON')
  exampleRow[11] = 5
  exampleRow[16] = t('exampleSource')
  exampleRow[17] = typeTranslations['Physical'] ?? 'Physical'
  exampleRow[20] = t('exampleEmissionFactor')

  const emptyRow: (string | number)[] = [siteName, postLabel, ...Array(TOTAL_EXCEL_COLS - 2).fill('')]

  const rows = post ? [exampleRow, ...Array.from({ length: 100 }, () => [...emptyRow])] : [exampleRow, emptyRow]
  return buildEmissionSourcesSheet(study, locale, rows)
}

function getEmissionSourcesHeaderRow(t: (key: string) => string): string[] {
  return [
    t('columnSite'),
    t('columnPost'),
    t('columnSubPost'),
    t('columnName'),
    t('columnTag'),
    t('columnCaracterisation'),
    t('columnValue'),
    t('columnUnit'),
    t('columnDepreciationPeriod'),
    t('columnConstructionYear'),
    t('columnGlobalUncertainty'),
    t('columnReliability'),
    t('columnTechnicalRepresentativeness'),
    t('columnGeographicRepresentativeness'),
    t('columnTemporalRepresentativeness'),
    t('columnCompleteness'),
    t('columnSource'),
    t('columnType'),
    t('columnComment'),
    t('columnEfId'),
    t('columnEfUsed'),
    t('columnEfValue'),
    t('columnEfUnit'),
    t('columnGlobalUncertainty'),
    t('columnReliability'),
    t('columnTechnicalRepresentativeness'),
    t('columnGeographicRepresentativeness'),
    t('columnTemporalRepresentativeness'),
    t('columnCompleteness'),
    t('columnEfSource'),
    t('columnEfType'),
    t('columnFeComment'),
    t('columnValidation'),
    t('columnCalculatedValue'),
    t('columnCalculatedUncertainty'),
  ]
}

function buildEmissionSourcesCSV(locale: LocaleType, dataRows: (string | number)[][]): string {
  const bc = getBcTranslations(locale)
  const modal = bc.study.importEmissionSourcesModal as Record<string, string>
  const t = (key: string) => modal[key] ?? key

  const encodeField = (field: string | number = '') => {
    if (typeof field === 'number') {
      return String(field)
    }
    const escaped = field.replace(/"/g, '""')
    if (escaped.includes(';') || escaped.includes('"') || escaped.includes('\n')) {
      return `"${escaped}"`
    }
    return escaped
  }

  const headerRow = getEmissionSourcesHeaderRow(t).join(';')

  const rows = dataRows.map((row) => row.map(encodeField).join(';'))
  return [headerRow, ...rows].join('\n')
}

async function buildEmissionSourcesDataRows(
  study: FullStudy,
  locale: LocaleType,
  post?: Post,
): Promise<(string | number)[][]> {
  const bc = getBcTranslations(locale)
  const modal = (bc.study as Record<string, unknown>)?.importEmissionSourcesModal as Record<string, string> | undefined
  const t = (key: string) => modal?.[key] ?? key

  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const typeTranslations = bc.emissionSource.type as Record<string, string>
  const qualityTranslations = bc.quality as Record<string, string>
  const categorisationsTranslations = bc.categorisations as Record<string, string>
  const unitTranslations = bc.units as Record<string, string>
  const efImportSourceTranslations = bc.emissionFactors.table as unknown as Record<string, string>

  const postSubPosts = post ? new Set(subPostsByPost[post]) : null
  const emissionSources = [...study.emissionSources]
    .filter((es) => !postSubPosts || postSubPosts.has(es.subPost))
    .sort((a, b) => a.subPost.localeCompare(b.subPost))
  const emissionFactorIds = emissionSources
    .map((es) => es.emissionFactor?.id)
    .filter((id): id is string => id !== undefined)

  const emissionFactorsData = await getEmissionFactorsByIds(emissionFactorIds, study.id)
  const emissionFactors = emissionFactorsData.success ? emissionFactorsData.data : []

  const getQualityLabel = (quality: ReturnType<typeof getQualitativeUncertaintyFromQuality> | null) =>
    quality !== null ? (qualityTranslations[String(quality)] ?? '') : ''

  const getQualityFieldLabel = (value: number | null) =>
    value !== null ? (qualityTranslations[String(value)] ?? '') : ''

  const studyVersionIds = new Set(study.emissionFactorVersions.map((v) => v.importVersionId))

  return emissionSources.map((es) => {
    const ef = emissionFactors.find((f) => f.id === es.emissionFactor?.id)
    const esPost = getPost(es.subPost)
    const postLabel = esPost ? (postTranslations[esPost] ?? esPost) : ''
    const subPostLabel = postTranslations[es.subPost] ?? es.subPost
    const tagLabel = es.emissionSourceTags.map((tag) => tag.tag.name).join(', ')
    const caracterisationLabel = es.caracterisation
      ? (categorisationsTranslations[es.caracterisation] ?? es.caracterisation)
      : ''
    const typeLabel = es.type ? (typeTranslations[es.type] ?? es.type) : ''
    const unitRaw = ef?.unit ? (unitTranslations[ef.unit] ?? ef.unit) : ''
    const unitLabel = unitRaw ? getSingularForm(unitRaw) : ''
    const efTitle = ef?.metaData?.title ?? ''
    const efValue = ef ? ef.totalCo2 : ''
    const efUnitRaw = ef?.unit ? (unitTranslations[ef.unit] ?? ef.unit) : ''
    const efUnitLabel = efUnitRaw ? getSingularForm(efUnitRaw) : ''
    const feSpecificQuality = ef ? getSpecificEmissionFactorQuality(es) : null
    const feQualityLabel = feSpecificQuality
      ? getQualityLabel(getQualitativeUncertaintyFromQuality(feSpecificQuality))
      : ''
    const efSourceBase = ef ? (efImportSourceTranslations[ef.importedFrom] ?? ef.importedFrom) : ''
    const efVersion = ef?.versions.find((v) => studyVersionIds.has(v.importVersionId))
    const efSource = ef ? [efSourceBase, efVersion?.importVersion?.name].filter(Boolean).join(' ') : ''
    const efTypeLabel = ef
      ? ef.isMonetary
        ? ef.importedFrom === 'Manual'
          ? t('efTypeMonetarySpecific')
          : t('efTypeMonetaryNonSpecific')
        : ef.importedFrom === 'Manual'
          ? t('efTypeOrga')
          : t('efTypeBDD')
      : ''
    const globalUncertaintyLabel = getQualityLabel(getQualitativeUncertaintyFromQuality(es))
    const environment = study.organizationVersion.environment
    const calculatedEmission = getEmissionSourceEmission(es, environment) ?? 0
    const calculatedValue = formatEmissionValueForExport(calculatedEmission, study.resultsUnit)
    const emissionSourceSD = getSquaredStandardDeviationForEmissionSource(es)
    const calculatedUncertaintyLabel = emissionSourceSD
      ? getQualityLabel(getQualitativeUncertaintyFromSquaredStandardDeviation(emissionSourceSD))
      : ''
    const studyResultsUnits = ((bc.study as Record<string, unknown>)?.results as Record<string, unknown>)?.units as
      | Record<string, string>
      | undefined
    const resultsUnitLabel = studyResultsUnits?.[study.resultsUnit] ?? study.resultsUnit
    const exportTranslations = bc.study.export
    const validationLabel = es.validated ? exportTranslations.yes : exportTranslations.no

    return [
      es.studySite.site.name,
      postLabel,
      subPostLabel,
      es.name,
      tagLabel,
      caracterisationLabel,
      es.value ?? '',
      unitLabel,
      es.depreciationPeriod ?? '',
      es.constructionYear ? es.constructionYear.getFullYear() : '',
      globalUncertaintyLabel,
      getQualityFieldLabel(es.reliability),
      getQualityFieldLabel(es.technicalRepresentativeness),
      getQualityFieldLabel(es.geographicRepresentativeness),
      getQualityFieldLabel(es.temporalRepresentativeness),
      getQualityFieldLabel(es.completeness),
      es.source ?? '',
      typeLabel,
      es.comment ?? '',
      ef?.id ?? '',
      efTitle,
      efValue,
      efUnitLabel,
      feQualityLabel,
      feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.reliability) : '',
      feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.technicalRepresentativeness) : '',
      feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.geographicRepresentativeness) : '',
      feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.temporalRepresentativeness) : '',
      feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.completeness) : '',
      efSource,
      efTypeLabel,
      es.feComment ?? '',
      validationLabel,
      `${calculatedValue} ${resultsUnitLabel}`,
      calculatedUncertaintyLabel,
    ]
  })
}

export async function exportEmissionSourcesToCSV(studyId: string, post?: Post): Promise<string> {
  const account = await getAuthenticatedAccount()
  const study = await getStudyOrThrow(studyId, account)
  if (!(await canReadStudy(accountWithUserToUserSession(account), studyId))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const dataRows = await buildEmissionSourcesDataRows(study, locale, post)
  return buildEmissionSourcesCSV(locale, dataRows)
}

export async function exportEmissionSourcesToExcel(studyId: string, post?: Post): Promise<ArrayBuffer> {
  const account = await getAuthenticatedAccount()
  const study = await getStudyOrThrow(studyId, account)
  if (!(await canReadStudy(accountWithUserToUserSession(account), studyId))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const dataRows = await buildEmissionSourcesDataRows(study, locale, post)
  return buildEmissionSourcesSheet(study, locale, dataRows)
}
