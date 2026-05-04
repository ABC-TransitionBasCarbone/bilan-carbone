'use server'

import { getAccountById } from '@/db/account'
import { createEmissionFactorWithParts, getManualEmissionFactorsByOrganization } from '@/db/emissionFactors'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { environmentSubPostsMapping } from '@/services/posts'
import {
  COLUMNS,
  ImportEmissionFactorsResult,
  ImportError,
  ParsedRow,
  ParseResult,
  PreviewEmissionFactorsResult,
  PreviewRow,
} from '@/types/importEmissionFactors.types'
import {
  buildPostsAndSubPostsCell,
  getUnitLabel,
  mapBaseLabelFromTranslations,
  mapQualityLabelFromTranslations,
  mapUnitLabelFromTranslations,
  parsePostsAndSubPostsCell,
} from '@/utils/importEmissionFactors.utils'
import { parseNumericValue } from '@/utils/number'
import { flattenSubposts } from '@/utils/post'
import { withServerResponse } from '@/utils/serverResponse'
import { getBcTranslations } from '@/utils/translation.utils'
import { EmissionFactorStatus, Environment, Import, SubPost, Unit } from '@repo/db-common/enums'
import xlsx from 'node-xlsx'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor.server'
import { EmissionFactorCommandValidation } from './emissionFactor.command'
import { prepareExcel } from './file'
import { getFileUrlFromBucket } from './scaleway'

async function checkAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error(NOT_AUTHORIZED)
  }

  const account = await getAccountById(session.user.accountId)
  if (!account?.organizationVersionId) {
    throw new Error(NOT_AUTHORIZED)
  }

  if (!(await canCreateEmissionFactor(account.organizationVersionId))) {
    throw new Error(NOT_AUTHORIZED)
  }

  return account
}

function parseImportFile(buffer: Buffer, locale: LocaleType, environment: Environment): ParseResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let workbook: ReturnType<typeof xlsx.parse<any[]>>
  try {
    workbook = xlsx.parse(buffer, { raw: false })
  } catch {
    return { success: false, errors: [{ line: 0, key: 'invalidFileType' }] }
  }

  const sheet = workbook[0]
  if (!sheet?.data || sheet.data.length < 2) {
    return { success: false, errors: [{ line: 0, key: 'emptyFile' }] }
  }

  const dataRows = sheet.data.slice(1).filter((row) => String(row[COLUMNS.name] ?? '').trim() !== '')

  if (dataRows.length === 0) {
    return { success: false, errors: [{ line: 0, key: 'emptyFile' }] }
  }

  const errors: ImportError[] = []
  const parsedRows: ParsedRow[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const lineNum = i + 2
    const rowErrors: Omit<ImportError, 'line'>[] = []

    const name = String(row[COLUMNS.name] ?? '').trim()
    if (!name) {
      rowErrors.push({ key: 'missingName' })
    }

    const source = String(row[COLUMNS.source] ?? '').trim()
    if (!source) {
      rowErrors.push({ key: 'missingSource' })
    }

    const rawUnit = String(row[COLUMNS.unit] ?? '').trim()
    const unit = mapUnitLabelFromTranslations(rawUnit, locale)
    if (!unit) {
      rowErrors.push({ key: 'invalidUnit', value: rawUnit })
    }

    const customUnit = unit === Unit.CUSTOM ? String(row[COLUMNS.customUnit] ?? '').trim() || null : null

    const rawTotalCo2 = row[COLUMNS.totalCo2]
    const totalCo2 = parseNumericValue(rawTotalCo2)
    if (totalCo2 === null || totalCo2 < 0) {
      rowErrors.push({ key: 'invalidTotalCo2' })
    }

    const parseQuality = (col: keyof typeof COLUMNS, errorKey: string) => {
      const raw = row[COLUMNS[col]]
      const value = mapQualityLabelFromTranslations(raw, locale)
      if (value === null) {
        rowErrors.push({ key: errorKey, value: String(raw ?? '') })
      }
      return value
    }

    const reliability = parseQuality('reliability', 'invalidReliability')
    const technicalRepresentativeness = parseQuality(
      'technicalRepresentativeness',
      'invalidTechnicalRepresentativeness',
    )
    const geographicRepresentativeness = parseQuality(
      'geographicRepresentativeness',
      'invalidGeographicRepresentativeness',
    )
    const temporalRepresentativeness = parseQuality('temporalRepresentativeness', 'invalidTemporalRepresentativeness')
    const completeness = parseQuality('completeness', 'invalidCompleteness')

    const rawPostsAndSubPosts = String(row[COLUMNS.postsAndSubPosts] ?? '').trim()
    const parsedPosts = parsePostsAndSubPostsCell(rawPostsAndSubPosts, locale, environment)

    if (!parsedPosts.success) {
      rowErrors.push(...parsedPosts.errors)
    }

    const subPostsRecord = parsedPosts.success ? parsedPosts.subPosts : {}
    const flatSubPosts = Object.values(subPostsRecord).flat()

    const subPostsByPost = environmentSubPostsMapping[environment] as Record<string, SubPost[]>
    for (const [post, subPostList] of Object.entries(subPostsRecord)) {
      const allowedSubPosts = subPostsByPost[post]
      const invalidSubPosts = subPostList.filter((sp) => allowedSubPosts && !allowedSubPosts.includes(sp))
      if (invalidSubPosts.length > 0) {
        rowErrors.push({ key: 'incompatibleSubPosts', value: invalidSubPosts.join(', ') })
      }
    }

    const rawBase = String(row[COLUMNS.base] ?? '').trim()
    const base = mapBaseLabelFromTranslations(rawBase, locale)

    if (flatSubPosts.includes(SubPost.Electricite) && !base) {
      rowErrors.push({ key: 'missingBase', value: rawBase || undefined })
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map((e) => ({ line: lineNum, ...e })))
      continue
    }

    const command = {
      name,
      attribute: String(row[COLUMNS.attribute] ?? '').trim() || undefined,
      location: String(row[COLUMNS.location] ?? '').trim() || undefined,
      source,
      unit: unit!,
      customUnit: customUnit ?? undefined,
      isMonetary: false,
      totalCo2: totalCo2!,
      co2f: parseNumericValue(row[COLUMNS.co2f]) ?? undefined,
      ch4f: parseNumericValue(row[COLUMNS.ch4f]) ?? undefined,
      ch4b: parseNumericValue(row[COLUMNS.ch4b]) ?? undefined,
      n2o: parseNumericValue(row[COLUMNS.n2o]) ?? undefined,
      co2b: parseNumericValue(row[COLUMNS.co2b]) ?? undefined,
      sf6: parseNumericValue(row[COLUMNS.sf6]) ?? undefined,
      hfc: parseNumericValue(row[COLUMNS.hfc]) ?? undefined,
      pfc: parseNumericValue(row[COLUMNS.pfc]) ?? undefined,
      otherGES: parseNumericValue(row[COLUMNS.otherGES]) ?? undefined,
      reliability: reliability!,
      technicalRepresentativeness: technicalRepresentativeness!,
      geographicRepresentativeness: geographicRepresentativeness!,
      temporalRepresentativeness: temporalRepresentativeness!,
      completeness: completeness!,
      subPosts: subPostsRecord,
      comment: String(row[COLUMNS.comment] ?? '').trim() || undefined,
      parts: [], // Not supported yet
      base,
      rawPostsAndSubPosts,
      rawUnit,
    }

    const validation = EmissionFactorCommandValidation.safeParse(command)
    if (!validation.success) {
      errors.push(
        ...validation.error.issues.map((issue) => ({
          line: lineNum,
          key: 'validationError',
          value: issue.path.join('.'),
        })),
      )
      continue
    }

    parsedRows.push({ ...validation.data, rawPostsAndSubPosts, rawUnit } as ParsedRow)
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  return { success: true, rows: parsedRows }
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
      unit: command.unit,
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
  const organizationId = account.organizationVersion!.organizationId

  for (const row of result.rows) {
    const { data, parts, locale: rowLocale } = buildCreateInput(row, organizationId, locale)
    await createEmissionFactorWithParts(data, parts, rowLocale)
  }

  return { success: true, count: result.rows.length }
}

export async function exportManualEmissionFactorsToFile(): Promise<ArrayBuffer> {
  const account = await checkAuth()
  const locale = await getLocale()
  const bc = getBcTranslations(locale)
  const baseTranslations = bc.emissionFactors.base
  const qualityTranslations = bc.quality as Record<string, string>

  const organizationId = account.organizationVersion!.organizationId
  const emissionFactors = await getManualEmissionFactorsByOrganization(organizationId)

  const c = bc.emissionFactors.create
  const tbl = bc.emissionFactors.table
  const header = [
    c.name,
    c.attribute,
    c.location,
    c.source,
    c.unit,
    c.customUnit,
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
    tbl.reliability.replace(/ :$/, ''),
    tbl.technicalRepresentativeness.replace(/ :$/, ''),
    tbl.geographicRepresentativeness.replace(/ :$/, ''),
    tbl.temporalRepresentativeness.replace(/ :$/, ''),
    tbl.completeness.replace(/ :$/, ''),
    c.post,
    c.base,
    c.comment,
  ]
  const rows: (string | number)[][] = emissionFactors.map((ef) => {
    const metaData = ef.metaData.find((m) => m.language === locale) ?? ef.metaData[0]
    return [
      metaData?.title ?? '',
      metaData?.attribute ?? '',
      ef.location ?? '',
      ef.source ?? '',
      ef.unit ? getUnitLabel(ef.unit, locale) : '',
      ef.customUnit ?? '',
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
      qualityTranslations[String(ef.reliability)] ?? '',
      qualityTranslations[String(ef.technicalRepresentativeness)] ?? '',
      qualityTranslations[String(ef.geographicRepresentativeness)] ?? '',
      qualityTranslations[String(ef.temporalRepresentativeness)] ?? '',
      qualityTranslations[String(ef.completeness)] ?? '',
      buildPostsAndSubPostsCell(ef.subPosts, locale, account.environment),
      ef.base ? (baseTranslations[ef.base] ?? ef.base) : '',
      metaData?.comment ?? '',
    ]
  })

  return prepareExcel([{ name: "Facteurs d'émission", data: [header, ...rows], options: {} }])
}

export const getImportEmissionFactorsTemplateUrl = async () =>
  withServerResponse('getImportEmissionFactorsTemplateUrl', async () => {
    const key = process.env.SCW_EF_TEMPLATE_KEY
    if (!key) {
      throw new Error('templateNotFound')
    }
    const res = await getFileUrlFromBucket(key)
    if (!res.success) {
      throw new Error('templateNotFound')
    }
    return res.data
  })
