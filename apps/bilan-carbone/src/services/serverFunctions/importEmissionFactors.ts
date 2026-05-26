'use server'

import { createEmissionFactorWithParts, getManualEmissionFactorsByOrganization } from '@/db/emissionFactors'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { AccountWithUser } from '@/types/account.types'
import {
  COLUMNS,
  ImportEmissionFactorsResult,
  ParsedRow,
  PreviewEmissionFactorsResult,
  PreviewRow,
} from '@/types/importEmissionFactors.types'
import {
  buildPostsAndSubPostsCell,
  getAllPostsLabel,
  getUnitLabel,
  parseImportFile,
} from '@/utils/importEmissionFactors.utils'
import { flattenSubposts } from '@/utils/post'
import { withServerResponse } from '@/utils/serverResponse'
import { getBcTranslations } from '@/utils/translation.utils'
import { EmissionFactorBase, EmissionFactorStatus, Import } from '@abc-transitionbascarbone/db-common/enums'
import { getAuthenticatedAccount } from '../permissions/account.permissions'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canReadEmissionFactor } from '../permissions/emissionFactor'
import { canCreateEmissionFactor } from '../permissions/emissionFactor.server'
import { prepareExcel } from './file'

async function checkAuth(requireCreatePermission = true): Promise<AccountWithUser> {
  const account = await getAuthenticatedAccount()

  if (requireCreatePermission) {
    if (!(await canCreateEmissionFactor(account.organizationVersionId))) {
      throw new Error(NOT_AUTHORIZED)
    }
  } else {
    if (
      !canReadEmissionFactor(account, {
        organizationId: account.organizationVersion.organizationId,
        importedFrom: Import.Manual,
      })
    ) {
      throw new Error(NOT_AUTHORIZED)
    }
  }

  return account
}

export async function previewEmissionFactorsFromFile(file: File): Promise<PreviewEmissionFactorsResult> {
  const account = await checkAuth()

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseImportFile(buffer, locale, account.environment)

  if (!result.success) {
    return result
  }

  const rows: PreviewRow[] = result.rows.map((row) => ({
    name: row.name,
    source: row.source,
    unit: row.rawUnit,
    customUnit: row.customUnit ?? null,
    totalCo2: row.totalCo2,
    postsAndSubPosts: row.rawPostsAndSubPosts,
  }))

  return { success: true, rows }
}

function buildCreateInput(row: ParsedRow, organizationId: string, locale: LocaleType) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { name, attribute, comment, subPosts, parts, rawPostsAndSubPosts, rawUnit, ...command } = row
  return {
    data: {
      ...command,
      importedFrom: Import.Manual,
      status: EmissionFactorStatus.Valid,
      organization: { connect: { id: organizationId } },
      subPosts: flattenSubposts(subPosts),
      metaData: { create: { language: locale, title: name, attribute, comment } },
    },
    parts,
    locale,
  }
}

export async function importEmissionFactorsFromFile(file: File): Promise<ImportEmissionFactorsResult> {
  const account = await checkAuth()

  const locale = await getLocale()
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = parseImportFile(buffer, locale, account.environment)

  if (!result.success) {
    return result
  }
  const organizationId = account.organizationVersion.organizationId

  for (const row of result.rows) {
    const { data, parts, locale: rowLocale } = buildCreateInput(row, organizationId, locale)
    await createEmissionFactorWithParts(data, parts, rowLocale)
  }

  return { success: true, count: result.rows.length }
}

export async function exportManualEmissionFactorsToFile(): Promise<ArrayBuffer> {
  const account = await checkAuth(false)
  const locale = await getLocale()
  const bc = getBcTranslations(locale)
  const baseTranslations = bc.emissionFactors.base
  const qualityTranslations = bc.quality as Record<string, string>

  const organizationId = account.organizationVersion.organizationId
  const emissionFactors = await getManualEmissionFactorsByOrganization(organizationId)

  const c = bc.emissionFactors.create
  const tbl = bc.emissionFactors.table
  const header = [
    c.name,
    c.attribute,
    c.unit,
    c.customUnit,
    c.source,
    c.location,
    tbl.technicalRepresentativeness.replace(/ :$/, ''),
    tbl.geographicRepresentativeness.replace(/ :$/, ''),
    tbl.temporalRepresentativeness.replace(/ :$/, ''),
    tbl.completeness.replace(/ :$/, ''),
    tbl.reliability.replace(/ :$/, ''),
    c.comment,
    c.totalCo2,
    c.co2f,
    c.ch4f,
    c.ch4b,
    c.n2o,
    c.co2b,
    c.sf6,
    c.hfc,
    c.pfc,
    c.otherGES,
    c.post,
    c.base,
    c.addedDate,
  ]
  const rows: (string | number)[][] = emissionFactors.map((ef) => {
    const metaData = ef.metaData.find((m) => m.language === locale) ?? ef.metaData[0]
    return [
      metaData?.title ?? '',
      metaData?.attribute ?? '',
      ef.unit && !ef.customUnit ? `kgCO2e/${getUnitLabel(ef.unit, locale)}` : '',
      ef.customUnit ? `kgCO2e/${ef.customUnit}` : '',
      ef.source ?? '',
      ef.location ?? '',
      qualityTranslations[String(ef.technicalRepresentativeness)] ?? '',
      qualityTranslations[String(ef.geographicRepresentativeness)] ?? '',
      qualityTranslations[String(ef.temporalRepresentativeness)] ?? '',
      qualityTranslations[String(ef.completeness)] ?? '',
      qualityTranslations[String(ef.reliability)] ?? '',
      metaData?.comment ?? '',
      ef.totalCo2,
      ef.co2f ?? '',
      ef.ch4f ?? '',
      ef.ch4b ?? '',
      ef.n2o ?? '',
      ef.co2b ?? '',
      ef.sf6 ?? '',
      ef.hfc ?? '',
      ef.pfc ?? '',
      ef.otherGES ?? '',
      buildPostsAndSubPostsCell(ef.subPosts, locale, account.environment),
      ef.base ? (baseTranslations[ef.base] ?? ef.base) : '',
      ef.createdAt.toLocaleDateString(locale),
    ]
  })

  return prepareExcel([{ name: "Facteurs d'émission", data: [header, ...rows], options: {} }])
}

function buildEmissionFactorsTemplateHeader(locale: LocaleType): string[] {
  const bc = getBcTranslations(locale)
  const c = bc.emissionFactors.create
  const tbl = bc.emissionFactors.table
  const modal = bc.emissionFactors.importModal as unknown as Record<string, string>
  return [
    c.name,
    c.attribute,
    c.unit,
    c.customUnit,
    c.source,
    c.location,
    (tbl.technicalRepresentativeness as string).replace(/ :$/, ''),
    (tbl.geographicRepresentativeness as string).replace(/ :$/, ''),
    (tbl.temporalRepresentativeness as string).replace(/ :$/, ''),
    (tbl.completeness as string).replace(/ :$/, ''),
    (tbl.reliability as string).replace(/ :$/, ''),
    c.comment,
    c.totalCo2,
    c.co2f,
    c.ch4f,
    c.ch4b,
    c.n2o,
    c.co2b,
    c.sf6,
    c.hfc,
    c.pfc,
    c.otherGES,
    modal.templatePostsHeader,
    modal.templateBaseHeader,
  ]
}

export const getImportEmissionFactorsTemplate = async () =>
  withServerResponse('getImportEmissionFactorsTemplate', async () => {
    await checkAuth()
    const locale = await getLocale()
    const bc = getBcTranslations(locale)
    const modal = bc.emissionFactors.importModal as unknown as Record<string, string>
    const qualityTranslations = bc.quality as Record<string, string>

    const TOTAL_COLS = Object.keys(COLUMNS).length
    const allPostsLabel = getAllPostsLabel(locale)

    const exampleRow: (string | number)[] = Array(TOTAL_COLS).fill('')
    exampleRow[COLUMNS.name] = `${modal.examplePrefix} ${modal.exampleName}`
    exampleRow[COLUMNS.attribute] = modal.exampleAttribute
    exampleRow[COLUMNS.unit] = 'kgCO2e/kg'
    exampleRow[COLUMNS.source] = modal.exampleSource
    exampleRow[COLUMNS.location] = modal.exampleLocation
    exampleRow[COLUMNS.technicalRepresentativeness] = qualityTranslations['5']
    exampleRow[COLUMNS.geographicRepresentativeness] = qualityTranslations['5']
    exampleRow[COLUMNS.temporalRepresentativeness] = qualityTranslations['5']
    exampleRow[COLUMNS.completeness] = qualityTranslations['5']
    exampleRow[COLUMNS.reliability] = qualityTranslations['5']
    exampleRow[COLUMNS.comment] = modal.examplePostsAndSubPostsComment
    exampleRow[COLUMNS.totalCo2] = 884
    exampleRow[COLUMNS.postsAndSubPosts] = modal.examplePostsAndSubPosts

    const emptyRow: (string | number)[] = Array(TOTAL_COLS).fill('')
    emptyRow[COLUMNS.postsAndSubPosts] = allPostsLabel
    emptyRow[COLUMNS.base] = bc.emissionFactors.base[EmissionFactorBase.LocationBased]

    const header = buildEmissionFactorsTemplateHeader(locale)
    const dataRows = [exampleRow, ...Array.from({ length: 100 }, () => [...emptyRow])]
    const sheetName = modal.sheetName

    return prepareExcel([{ name: sheetName, data: [header, ...dataRows], options: {} }])
  })
