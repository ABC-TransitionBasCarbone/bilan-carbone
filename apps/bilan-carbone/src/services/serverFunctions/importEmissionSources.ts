'use server'

import { EmissionFactorList, findEmissionFactorByIdForMatch } from '@/db/emissionFactors'
import { createEmissionSourcesOnStudy } from '@/db/emissionSource'
import { FullStudy, getStudyById } from '@/db/study'
import { getLocale } from '@/i18n/locale'
import { Post, subPostsByPost } from '@/services/posts'
import { AccountWithUser } from '@/types/account.types'
import { FEChoices, ImportResult } from '@/types/import.types'
import {
  PreviewEmissionSourceRow,
  ResolveEmissionSourcesResult,
  SOURCE_IMPORT_COLUMNS,
  ValidateEmissionSourcesResult,
} from '@/types/importEmissionSources.types'
import { getEmissionFactorFullName, getEmissionFactorValue } from '@/utils/emissionFactors'
import { EmissionFactorMatchType, findEmissionFactorMatch } from '@/utils/findEmissionFactor.utils'
import { formatPrefixedUnitDisplay } from '@/utils/import.utils'
import {
  getImportEmissionSourcesTranslations,
  parseEmissionSourcesFile,
  resolveEmissionFactorRows,
} from '@/utils/importEmissionSources.utils'
import { getPost } from '@/utils/post'
import { withServerResponse } from '@/utils/serverResponse'
import { formatEmissionValueForExport, isCASSubPost } from '@/utils/study'
import { getBcTranslations, getSingularForm } from '@/utils/translation.utils'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import {
  ControlMode,
  EmissionSourceCaracterisation,
  EmissionSourceType,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import { LocaleType } from '@abc-transitionbascarbone/i18n/config'
import { yearToDate } from '@abc-transitionbascarbone/utils'
import xlsx from 'node-xlsx'
import { canBeValidated, getCaracterisationsBySubPost, getEmissionSourceEmission } from '../emissionSource'
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

type NewEmissionSourceRow = {
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
  feComment?: string
  depreciationPeriod?: number
  constructionYear?: Date
  hectare?: number // Generated for CAS, not in import file
  duration?: number // Generated for CAS, not in import file
  validated?: boolean
}

const TOTAL_EXCEL_COLS = Object.keys(SOURCE_IMPORT_COLUMNS).length
const CAS_DEFAULT_DURATION = 20

function getHectareAndDuration(isCAS: boolean, value: number | undefined) {
  if (!isCAS || value == null) {
    return { hectare: null, duration: null }
  }
  return { hectare: value / CAS_DEFAULT_DURATION, duration: CAS_DEFAULT_DURATION }
}

async function getStudyOrThrow(studyId: string, account: AccountWithUser): Promise<FullStudy> {
  const study = await getStudyById(studyId, account.organizationVersionId)
  if (!study) {
    throw new Error(NOT_AUTHORIZED)
  }
  return study
}

export async function validateEmissionSourcesFromFile(
  file: File,
  studyId: string,
): Promise<ValidateEmissionSourcesResult> {
  const account = await getAuthenticatedAccount()

  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseEmissionSourcesFile(buffer, locale, study.sites)

  if (!result.success) {
    return { status: 'error', errors: result.errors }
  }

  const organizationId = study.organizationVersion.organization?.id ?? ''
  const versionIds = study.emissionFactorVersions.map((v) => v.importVersionId)

  const resolved = await resolveEmissionFactorRows(result.rows, {}, locale, organizationId, versionIds)

  if (resolved.type === 'warnings') {
    return { status: 'warnings', warnings: resolved.warnings, ambiguousRows: resolved.ambiguousRows }
  }

  if (resolved.type === 'ambiguous') {
    return { status: 'ambiguous', rows: resolved.ambiguousRows }
  }

  return { status: 'ok' }
}

// Preview-only: parse the file, apply user choices, and return display rows without persisting anything
export async function resolveEmissionSourcesFromFile(
  file: File,
  studyId: string,
  choices: FEChoices,
): Promise<ResolveEmissionSourcesResult> {
  const account = await getAuthenticatedAccount()

  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseEmissionSourcesFile(buffer, locale, study.sites)

  if (!result.success) {
    return { status: 'error', errors: result.errors }
  }

  const organizationId = study.organizationVersion.organization?.id ?? ''
  const versionIds = study.emissionFactorVersions.map((v) => v.importVersionId)

  const resolved = await resolveEmissionFactorRows(result.rows, choices, locale, organizationId, versionIds)

  const bc = getBcTranslations(locale)
  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>

  const rows: PreviewEmissionSourceRow[] = result.rows.map((row) => {
    const post = getPost(row.subPost)
    const ef = resolved.type === 'resolved' ? resolved.resolvedByLine.get(row.lineNumber) : undefined
    return {
      site: row.siteName,
      post: post ? (postTranslations[post] ?? post) : '',
      subPost: postTranslations[row.subPost],
      name: row.name,
      value: row.value !== undefined ? String(row.value) : '',
      unit: row.unit ?? '',
      emissionFactorId: ef?.efId ?? '',
      emissionFactorName: ef?.efName ?? '',
      emissionFactorValue: ef?.efValue ?? '',
      emissionFactorUnit: ef?.efUnit ?? '',
    }
  })

  return { status: 'ok', rows }
}

// Final import: parse the file, apply choices, persist emission sources to the database
export async function importEmissionSourcesFromFile(
  file: File,
  studyId: string,
  choices: FEChoices,
): Promise<ImportResult> {
  const account = await getAuthenticatedAccount()

  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseEmissionSourcesFile(buffer, locale, study.sites)

  if (!result.success) {
    return result
  }

  const organizationId = study.organizationVersion.organization?.id ?? ''
  const versionIds = study.emissionFactorVersions.map((v) => v.importVersionId)

  const newEmissionSourceRows: NewEmissionSourceRow[] = []

  for (const row of result.rows) {
    const lineNumber = row.lineNumber

    let emissionFactorId: string | undefined
    let efUnit: string | undefined

    if (lineNumber in choices) {
      const chosenId = choices[lineNumber]
      emissionFactorId = chosenId ?? undefined
      if (emissionFactorId) {
        const byId = await findEmissionFactorByIdForMatch(emissionFactorId)
        efUnit = byId?.customUnit ?? byId?.unit ?? undefined
      }
    } else {
      const ef = await findEmissionFactorMatch(
        row.emissionFactorId,
        row.emissionFactorName,
        row.emissionFactorValue,
        row.emissionFactorUnit,
        locale,
        organizationId,
        versionIds,
      )

      if (ef && ef.matchType !== EmissionFactorMatchType.NameAmbiguous) {
        emissionFactorId = ef.id
        efUnit = ef.foundUnit
      }
    }

    let validated = row.validated
    if (validated) {
      const isCASSubPost =
        row.subPost === SubPost.EmissionsLieesAuChangementDAffectationDesSolsCas && efUnit === 'HA_YEAR'
      const canValidate = canBeValidated(
        {
          name: row.name,
          type: row.type ?? null,
          value: row.value ?? null,
          emissionFactorId: emissionFactorId ?? null,
          caracterisation: row.caracterisation ?? null,
          subPost: row.subPost,
          constructionYear: row.constructionYear !== undefined ? yearToDate(row.constructionYear) : null,
          depreciationPeriod: row.depreciationPeriod ?? null,
          source: row.source ?? null,
          ...getHectareAndDuration(isCASSubPost, row.value),
        },
        study,
        { unit: efUnit },
        study.organizationVersion.environment,
      )
      if (!canValidate) {
        validated = false
      }
    }

    let caracterisation = row.caracterisation
    if (!caracterisation) {
      const availableCaracterisations = getCaracterisationsBySubPost(
        row.subPost,
        study.organizationVersion.environment,
        study.exports?.types ?? [],
        study.exports?.control ?? ControlMode.Operational,
      )
      if (availableCaracterisations.length === 1) {
        caracterisation = availableCaracterisations[0]
      }
    }

    const casFields = getHectareAndDuration(isCASSubPost(row.subPost, efUnit), row.value)
    newEmissionSourceRows.push({
      studySiteId: row.studySiteId,
      studyId,
      subPost: row.subPost,
      name: row.name,
      emissionFactorId,
      value: row.value,
      type: row.type,
      caracterisation,
      source: row.source,
      reliability: row.reliability,
      technicalRepresentativeness: row.technicalRepresentativeness,
      geographicRepresentativeness: row.geographicRepresentativeness,
      temporalRepresentativeness: row.temporalRepresentativeness,
      completeness: row.completeness,
      comment: row.comment,
      feComment: row.feComment,
      depreciationPeriod: row.depreciationPeriod,
      constructionYear:
        row.constructionYear !== undefined ? (yearToDate(row.constructionYear) ?? undefined) : undefined,
      hectare: casFields.hectare ?? undefined,
      duration: casFields.duration ?? undefined,
      validated,
    })
  }

  await createEmissionSourcesOnStudy(newEmissionSourceRows)

  return { success: true, errors: [], warnings: [] }
}

function buildEmissionSourcesSheet(study: FullStudy, locale: LocaleType, dataRows: (string | number)[][]): ArrayBuffer {
  const tranlations = getImportEmissionSourcesTranslations(locale)
  const t = (key: string) => tranlations[key] ?? key

  const DA_START = 6
  const DA_END = 18
  const FE_START = 19
  const FE_END = 31
  const BC_START = 32
  const BC_END = 35

  const empty = (n: number) => Array(n).fill('')

  const orgName = study.organizationVersion.organization?.name ?? ''
  const studyDate = study.startDate ? study.startDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') : ''

  const INFO_COLS_END = 20

  const metaRow: (string | number)[] = [t('exportOrganization'), orgName, ...empty(TOTAL_EXCEL_COLS - 2)]
  const dateRow: (string | number)[] = [t('exportDate'), studyDate, ...empty(TOTAL_EXCEL_COLS - 2)]
  const blankRow: (string | number)[] = empty(TOTAL_EXCEL_COLS)
  const infoRow1: (string | number)[] = [t('templateInfoLine1'), ...empty(TOTAL_EXCEL_COLS - 1)]
  const infoRow2: (string | number)[] = [t('templateInfoLine2'), ...empty(TOTAL_EXCEL_COLS - 1)]
  const infoRow3: (string | number)[] = [t('templateInfoLine3'), ...empty(TOTAL_EXCEL_COLS - 1)]
  const infoRow4: (string | number)[] = [t('templateInfoLine4'), ...empty(TOTAL_EXCEL_COLS - 1)]
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

  const INFO_ROW1_INDEX = 3
  const INFO_ROW2_INDEX = 4
  const INFO_ROW3_INDEX = 5
  const INFO_ROW4_INDEX = 6
  const GROUP_ROW_INDEX = 8

  const merges = [
    { s: { r: INFO_ROW1_INDEX, c: 0 }, e: { r: INFO_ROW1_INDEX, c: INFO_COLS_END } },
    { s: { r: INFO_ROW2_INDEX, c: 0 }, e: { r: INFO_ROW2_INDEX, c: INFO_COLS_END } },
    { s: { r: INFO_ROW3_INDEX, c: 0 }, e: { r: INFO_ROW3_INDEX, c: INFO_COLS_END } },
    { s: { r: INFO_ROW4_INDEX, c: 0 }, e: { r: INFO_ROW4_INDEX, c: INFO_COLS_END } },
    { s: { r: GROUP_ROW_INDEX, c: DA_START }, e: { r: GROUP_ROW_INDEX, c: DA_END } },
    { s: { r: GROUP_ROW_INDEX, c: FE_START }, e: { r: GROUP_ROW_INDEX, c: FE_END } },
    { s: { r: GROUP_ROW_INDEX, c: BC_START }, e: { r: GROUP_ROW_INDEX, c: BC_END } },
  ]

  const sheetName = t('sheetName')
  const sheetData = [
    metaRow,
    dateRow,
    blankRow,
    infoRow1,
    infoRow2,
    infoRow3,
    infoRow4,
    blankRow,
    groupRow,
    headerRow,
    ...dataRows,
  ]
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
  const translations = getImportEmissionSourcesTranslations(locale)
  const t = (key: string) => translations[key] ?? key

  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const unitTranslations = bc.units as Record<string, string>
  const typeTranslations = (bc.emissionSource as Record<string, unknown>).type as Record<string, string>
  const categorisationsTranslations = bc.categorisations as Record<string, string>

  const studySite = siteId ? study.sites.find((s) => s.site?.id === siteId) : study.sites[0]
  const siteName = studySite?.site?.name ?? ''
  const postLabel = post ? (postTranslations[post] ?? post) : ''

  const columns = SOURCE_IMPORT_COLUMNS
  const exampleRow: (string | number)[] = Array(TOTAL_EXCEL_COLS).fill('')
  exampleRow[columns.site] = siteName
  exampleRow[columns.post] = postTranslations['IntrantsBiensEtMatieres']
  exampleRow[columns.subPost] = postTranslations['MetauxPlastiquesEtVerre']
  exampleRow[columns.name] = t('examplePrefix') + t('exampleName')
  exampleRow[columns.value] = 1000
  exampleRow[columns.unit] = getSingularForm(unitTranslations['TON'])
  exampleRow[columns.caracterisation] = categorisationsTranslations['Operated']
  exampleRow[columns.source] = t('exampleSource')
  exampleRow[columns.type] = typeTranslations['Physical']
  exampleRow[columns.emissionFactorName] = t('exampleEmissionFactor')
  exampleRow[columns.emissionFactorUnit] = formatPrefixedUnitDisplay(locale, Unit.TON)

  const emptyRow: (string | number)[] = Array(TOTAL_EXCEL_COLS).fill('')
  emptyRow[columns.site] = siteName
  emptyRow[columns.post] = postLabel

  const rows = post ? [exampleRow, ...Array.from({ length: 100 }, () => [...emptyRow])] : [exampleRow, emptyRow]
  return buildEmissionSourcesSheet(study, locale, rows)
}

function getEmissionSourcesHeaderRow(t: (key: string) => string): string[] {
  const row = Array<string>(TOTAL_EXCEL_COLS).fill('')
  for (const [col, index] of Object.entries(SOURCE_IMPORT_COLUMNS) as [string, number][]) {
    row[index] = t('column' + col.charAt(0).toUpperCase() + col.slice(1))
  }
  return row
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

type ExportTranslations = {
  locale: LocaleType
  t: (key: string) => string
  postTranslations: Record<string, string>
  typeTranslations: Record<string, string>
  qualityTranslations: Record<string, string>
  categorisationsTranslations: Record<string, string>
  unitTranslations: Record<string, string>
  efImportSourceTranslations: Record<string, string>
  exportYes: string
  exportNo: string
  resultsUnitLabel: string
}

function buildEmissionSourceRow(
  es: FullStudy['emissionSources'][number],
  ef: EmissionFactorList | undefined,
  study: FullStudy,
  studyVersionIds: Set<string>,
  translations: ExportTranslations,
): (string | number)[] {
  const {
    locale,
    t,
    postTranslations,
    typeTranslations,
    qualityTranslations,
    categorisationsTranslations,
    unitTranslations,
    efImportSourceTranslations,
    exportYes,
    exportNo,
    resultsUnitLabel,
  } = translations

  const getQualityLabel = (quality: ReturnType<typeof getQualitativeUncertaintyFromQuality> | null) =>
    quality !== null ? (qualityTranslations[String(quality)] ?? '') : ''
  const getQualityFieldLabel = (value: number | null) =>
    value !== null ? (qualityTranslations[String(value)] ?? '') : ''

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
  const efTitle = getEmissionFactorFullName(ef?.metaData)
  const efValue = ef ? getEmissionFactorValue(ef, study.organizationVersion.environment) : ''
  const efUnitLabel = ef?.unit ? formatPrefixedUnitDisplay(locale, ef.unit) : ''
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
  const validationLabel = es.validated ? exportYes : exportNo

  const C = SOURCE_IMPORT_COLUMNS
  const row = Array<string | number>(TOTAL_EXCEL_COLS).fill('')
  row[C.site] = es.studySite.site.name
  row[C.post] = postLabel
  row[C.subPost] = subPostLabel
  row[C.name] = es.name
  row[C.tag] = tagLabel
  row[C.caracterisation] = caracterisationLabel
  row[C.value] = es.value ?? ''
  row[C.unit] = unitLabel
  row[C.depreciationPeriod] = es.depreciationPeriod ?? ''
  row[C.constructionYear] = es.constructionYear ? es.constructionYear.getFullYear() : ''
  row[C.globalUncertainty] = globalUncertaintyLabel
  row[C.reliability] = getQualityFieldLabel(es.reliability)
  row[C.technicalRepresentativeness] = getQualityFieldLabel(es.technicalRepresentativeness)
  row[C.geographicRepresentativeness] = getQualityFieldLabel(es.geographicRepresentativeness)
  row[C.temporalRepresentativeness] = getQualityFieldLabel(es.temporalRepresentativeness)
  row[C.completeness] = getQualityFieldLabel(es.completeness)
  row[C.source] = es.source ?? ''
  row[C.type] = typeLabel
  row[C.comment] = es.comment ?? ''
  row[C.emissionFactorId] = ef?.importedId ?? ''
  row[C.emissionFactorName] = efTitle
  row[C.emissionFactorValue] = efValue
  row[C.emissionFactorUnit] = efUnitLabel
  row[C.feGlobalUncertainty] = feQualityLabel
  row[C.feReliability] = feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.reliability) : ''
  row[C.feTechnicalRepresentativeness] = feSpecificQuality
    ? getQualityFieldLabel(feSpecificQuality.technicalRepresentativeness)
    : ''
  row[C.feGeographicRepresentativeness] = feSpecificQuality
    ? getQualityFieldLabel(feSpecificQuality.geographicRepresentativeness)
    : ''
  row[C.feTemporalRepresentativeness] = feSpecificQuality
    ? getQualityFieldLabel(feSpecificQuality.temporalRepresentativeness)
    : ''
  row[C.feCompleteness] = feSpecificQuality ? getQualityFieldLabel(feSpecificQuality.completeness) : ''
  row[C.efSource] = efSource
  row[C.efType] = efTypeLabel
  row[C.feComment] = es.feComment ?? ''
  row[C.validation] = validationLabel
  row[C.calculatedValue] = calculatedValue
  row[C.calculatedUnit] = resultsUnitLabel
  row[C.calculatedUncertainty] = calculatedUncertaintyLabel
  return row
}

async function buildAllEmissionSourcesRows(
  study: FullStudy,
  locale: LocaleType,
  post?: Post,
): Promise<(string | number)[][]> {
  const bc = getBcTranslations(locale)
  const importTranslations = getImportEmissionSourcesTranslations(locale)
  const t = (key: string) => importTranslations[key] ?? key

  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const typeTranslations = bc.emissionSource.type as unknown as Record<string, string>
  const qualityTranslations = bc.quality as Record<string, string>
  const categorisationsTranslations = bc.categorisations as Record<string, string>
  const unitTranslations = bc.units
  const efImportSourceTranslations = bc.emissionFactors.table as unknown as Record<string, string>
  const studyResultsUnits = bc.study.results.units as Record<string, string>
  const resultsUnitLabel = studyResultsUnits?.[study.resultsUnit] ?? study.resultsUnit
  const exportTranslations = bc.study.export as Record<string, string>

  const translations = {
    locale,
    t,
    postTranslations,
    typeTranslations,
    qualityTranslations,
    categorisationsTranslations,
    unitTranslations,
    efImportSourceTranslations,
    exportYes: exportTranslations.yes,
    exportNo: exportTranslations.no,
    resultsUnitLabel,
  }

  const postSubPosts = post ? new Set(subPostsByPost[post]) : null
  const emissionSources = [...study.emissionSources]
    .filter((es) => !postSubPosts || postSubPosts.has(es.subPost))
    .sort((a, b) => a.subPost.localeCompare(b.subPost))
  const emissionFactorIds = emissionSources
    .map((es) => es.emissionFactor?.id)
    .filter((id): id is string => id !== undefined)

  const emissionFactorsData = await getEmissionFactorsByIds(emissionFactorIds, study.id)
  const emissionFactors: EmissionFactorList[] = emissionFactorsData.success ? emissionFactorsData.data : []
  const studyVersionIds = new Set(study.emissionFactorVersions.map((v) => v.importVersionId))

  return emissionSources.map((es) => {
    const ef = emissionFactors.find((f) => f.id === es.emissionFactor?.id)
    return buildEmissionSourceRow(es, ef, study, studyVersionIds, translations)
  })
}

export const exportEmissionSourcesToCSV = async (studyId: string, post?: Post) =>
  withServerResponse('exportEmissionSourcesToCSV', async () => {
    const account = await getAuthenticatedAccount()
    const study = await getStudyOrThrow(studyId, account)
    if (!(await canReadStudy(accountWithUserToUserSession(account), studyId))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const locale = await getLocale()
    const dataRows = await buildAllEmissionSourcesRows(study, locale, post)
    return buildEmissionSourcesCSV(locale, dataRows)
  })

export const exportEmissionSourcesToExcel = async (studyId: string, post?: Post) =>
  withServerResponse('exportEmissionSourcesToExcel', async () => {
    const account = await getAuthenticatedAccount()
    const study = await getStudyOrThrow(studyId, account)
    if (!(await canReadStudy(accountWithUserToUserSession(account), studyId))) {
      throw new Error(NOT_AUTHORIZED)
    }

    const locale = await getLocale()
    const dataRows = await buildAllEmissionSourcesRows(study, locale, post)
    return buildEmissionSourcesSheet(study, locale, dataRows)
  })
