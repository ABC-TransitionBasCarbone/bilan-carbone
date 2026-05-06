'use server'

import { getEmissionFactorByTitleValueAndUnit } from '@/db/emissionFactors'
import { createEmissionSourcesOnStudy } from '@/db/emissionSource'
import { FullStudy, getStudyById } from '@/db/study'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { AccountWithUser } from '@/types/account.types'
import {
  ImportEmissionSourceError,
  ImportEmissionSourcesResult,
  PreviewEmissionSourceRow,
  PreviewEmissionSourcesResult,
} from '@/types/importEmissionSources.types'
import { parseEmissionSourcesFile } from '@/utils/importEmissionSources.utils'
import { getPost } from '@/utils/post'
import { getBcTranslations, getSingularForm } from '@/utils/translation.utils'
import { accountWithUserToUserSession } from '@/utils/userAccounts'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@repo/db-common/enums'
import { revalidatePath } from 'next/cache'
import xlsx from 'node-xlsx'
import { getAuthenticatedAccount } from '../permissions/account.permissions'
import { NOT_AUTHORIZED } from '../permissions/check'
import { hasStudyBasicRights } from '../permissions/emissionSource'
import { canReadStudy } from '../permissions/study'
import { getQualitativeUncertaintyFromQuality, getSpecificEmissionFactorQuality } from '../uncertainty'
import { getEmissionFactorsByIds } from './emissionFactor'

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

  const rows: PreviewEmissionSourceRow[] = result.rows.map((row) => ({
    site: row.siteName,
    post: postTranslations[row.subPost] ?? row.subPost,
    subPost: postTranslations[row.subPost] ?? row.subPost,
    name: row.name,
    emissionFactorName: row.emissionFactorName ?? '',
    value: row.value !== undefined ? String(row.value) : '',
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
  }))

  return { success: true, rows }
}

export async function importEmissionSourcesFromFile(file: File, studyId: string): Promise<ImportEmissionSourcesResult> {
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

  const rowErrors: ImportEmissionSourceError[] = []
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

    const ef = await getEmissionFactorByTitleValueAndUnit(
      { title: row.emissionFactorName, value: row.emissionFactorValue, unit: row.emissionFactorUnit },
      locale,
      organizationId,
    )
    if (!ef) {
      rowErrors.push({ line: lineNum, key: 'emissionFactorNotFound', value: row.emissionFactorName })
      continue
    }
    const emissionFactorId = ef.id

    validRows.push({
      studySiteId,
      studyId,
      subPost: row.subPost,
      name: row.name,
      emissionFactorId,
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
    })
  }

  if (rowErrors.length > 0) {
    return { success: false, errors: rowErrors }
  }

  await createEmissionSourcesOnStudy(validRows)
  revalidatePath(`/etudes/${studyId}/comptabilisation/saisie-des-donnees`)

  return { success: true, count: validRows.length }
}

function buildEmissionSourcesWorkbook(
  study: FullStudy,
  locale: LocaleType,
  dataRows: (string | number)[][],
): ArrayBuffer {
  const bc = getBcTranslations(locale)
  const modal = (bc.study as Record<string, unknown>)?.importEmissionSourcesModal as Record<string, string> | undefined
  const t = (key: string) => modal?.[key] ?? key

  // Column layout:
  // Fixed cols [0-5]: Site, Poste, Sous-poste, Libellé, Tags, Caractérisation
  // DA group  [6-17]: Valeur, Unité, Durée amort., Incert. globale, Fiabilité, Rep. tech., Rep. géo., Rep. temp., Complétude, Source, Type, Hypothèses DA
  // FE group [18-29]: FE utilisé, Valeur FE, Unité FE, Incert. globale, Fiabilité, Rep. tech., Rep. géo., Rep. temp., Complétude, Source, Type, FE souhaité
  const TOTAL_COLS = 30
  const DA_START = 6
  const DA_END = 17
  const FE_START = 18
  const FE_END = 29

  const empty = (n: number) => Array(n).fill('')

  const orgName = study.organizationVersion.organization?.name ?? ''
  const studyDate = study.startDate ? study.startDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') : ''

  const metaRow: (string | number)[] = [t('exportOrganization'), orgName, ...empty(TOTAL_COLS - 2)]
  const dateRow: (string | number)[] = [t('exportDate'), studyDate, ...empty(TOTAL_COLS - 2)]
  const blankRow: (string | number)[] = empty(TOTAL_COLS)
  const groupRow: (string | number)[] = [
    ...empty(DA_START),
    t('groupActivityData'),
    ...empty(DA_END - DA_START),
    t('groupEmissionFactor'),
    ...empty(FE_END - FE_START),
  ]
  const headerRow: (string | number)[] = [
    t('columnSite'),
    t('columnPost'),
    t('columnSubPost'),
    t('columnName'),
    t('columnTag'),
    t('columnCaracterisation'),
    t('columnValue'),
    t('columnUnit'),
    t('columnDepreciationPeriod'),
    t('columnGlobalUncertainty'),
    t('columnReliability'),
    t('columnTechnicalRepresentativeness'),
    t('columnGeographicRepresentativeness'),
    t('columnTemporalRepresentativeness'),
    t('columnCompleteness'),
    t('columnSource'),
    t('columnType'),
    t('columnComment'),
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
  ]

  // Row indices: 0=meta, 1=date, 2=blank, 3=groupRow, 4=headerRow, 5+=data
  const GROUP_ROW_INDEX = 3
  const merges = [
    { s: { r: GROUP_ROW_INDEX, c: DA_START }, e: { r: GROUP_ROW_INDEX, c: DA_END } },
    { s: { r: GROUP_ROW_INDEX, c: FE_START }, e: { r: GROUP_ROW_INDEX, c: FE_END } },
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

export async function getImportEmissionSourcesTemplate(studyId: string): Promise<ArrayBuffer> {
  const account = await getAuthenticatedAccount()
  const study = await getStudyOrThrow(studyId, account)
  if (!(await hasStudyBasicRights(account, study))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const bc = getBcTranslations(locale)
  const modal = (bc.study as Record<string, unknown>)?.importEmissionSourcesModal as Record<string, string> | undefined
  const t = (key: string) => modal?.[key] ?? key

  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const typeTranslations = bc.emissionSource.type as Record<string, string>
  const qualityTranslations = bc.quality as Record<string, string>
  const unitTranslations = bc.units as Record<string, string>

  const exampleSiteName = study.sites[0]?.site?.name ?? ''
  const examplePostLabel = postTranslations['IntrantsBiensEtMatieres'] ?? ''
  const exampleSubPostLabel = postTranslations['MetauxPlastiquesEtVerre'] ?? ''
  const exampleTypeLabel = typeTranslations['Physical'] ?? ''
  const exampleQualityLabel = qualityTranslations['5'] ?? ''
  const exampleEfUnit = getSingularForm(unitTranslations['KG'] ?? '')

  const exampleRow: (string | number)[] = [
    exampleSiteName,
    examplePostLabel,
    exampleSubPostLabel,
    t('exampleName'),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    t('exampleSource'),
    exampleTypeLabel,
    '',
    t('exampleEmissionFactor'),
    1.85,
    exampleEfUnit,
    exampleQualityLabel,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]

  return buildEmissionSourcesWorkbook(study, locale, [exampleRow])
}

export async function exportEmissionSourcesToExcel(studyId: string): Promise<ArrayBuffer> {
  const account = await getAuthenticatedAccount()
  const study = await getStudyOrThrow(studyId, account)
  if (!(await canReadStudy(accountWithUserToUserSession(account), studyId))) {
    throw new Error(NOT_AUTHORIZED)
  }

  const locale = await getLocale()
  const bc = getBcTranslations(locale)
  const modal = (bc.study as Record<string, unknown>)?.importEmissionSourcesModal as Record<string, string> | undefined
  const t = (key: string) => modal?.[key] ?? key

  const postTranslations = bc.emissionFactors.post as unknown as Record<string, string>
  const typeTranslations = bc.emissionSource.type as Record<string, string>
  const qualityTranslations = bc.quality as Record<string, string>
  const categorisationsTranslations = bc.categorisations as Record<string, string>
  const unitTranslations = bc.units as Record<string, string>
  const efImportSourceTranslations = bc.emissionFactors.table as unknown as Record<string, string>

  const emissionSources = [...study.emissionSources].sort((a, b) => a.subPost.localeCompare(b.subPost))
  const emissionFactorIds = emissionSources
    .map((es) => es.emissionFactor?.id)
    .filter((id): id is string => id !== undefined)

  const emissionFactorsData = await getEmissionFactorsByIds(emissionFactorIds, studyId)
  const emissionFactors = emissionFactorsData.success ? emissionFactorsData.data : []

  const getQualityLabel = (quality: ReturnType<typeof getQualitativeUncertaintyFromQuality> | null) =>
    quality !== null ? (qualityTranslations[String(quality)] ?? '') : ''

  const getQualityFieldLabel = (value: number | null) =>
    value !== null ? (qualityTranslations[String(value)] ?? '') : ''

  const dataRows = emissionSources.map((es) => {
    const ef = emissionFactors.find((f) => f.id === es.emissionFactor?.id)
    const post = getPost(es.subPost)
    const postLabel = post ? (postTranslations[post] ?? post) : ''
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
    const efSource = ef ? [efSourceBase, ef.version?.name].filter(Boolean).join(' ') : ''
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
      globalUncertaintyLabel,
      getQualityFieldLabel(es.reliability),
      getQualityFieldLabel(es.technicalRepresentativeness),
      getQualityFieldLabel(es.geographicRepresentativeness),
      getQualityFieldLabel(es.temporalRepresentativeness),
      getQualityFieldLabel(es.completeness),
      es.source ?? '',
      typeLabel,
      es.comment ?? '',
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
    ]
  })

  return buildEmissionSourcesWorkbook(study, locale, dataRows)
}
