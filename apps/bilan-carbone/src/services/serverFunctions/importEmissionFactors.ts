'use server'

import { getAccountById } from '@/db/account'
import { createEmissionFactorWithParts } from '@/db/emissionFactors'
import { LocaleType } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
import { environmentSubPostsMapping } from '@/services/posts'
import {
  mapBaseLabelFromTranslations,
  mapQualityLabelFromTranslations,
  mapUnitLabelFromTranslations,
  parsePostsAndSubPostsCell,
} from '@/utils/importEmissionFactors.utils'
import { parseNumericValue } from '@/utils/number'
import { flattenSubposts } from '@/utils/post'
import { withServerResponse } from '@/utils/serverResponse'
import { EmissionFactorBase, EmissionFactorStatus, Environment, Import, SubPost, Unit } from '@repo/db-common/enums'
import xlsx from 'node-xlsx'
import { auth } from '../auth'
import { NOT_AUTHORIZED } from '../permissions/check'
import { canCreateEmissionFactor } from '../permissions/emissionFactor.server'
import { EmissionFactorCommandValidation } from './emissionFactor.command'
import { getFileUrlFromBucket } from './scaleway'

type ImportError = {
  line: number
  key: string
  value?: string
}

type ImportEmissionFactorsResult = { success: true; count: number } | { success: false; errors: ImportError[] }

type PreviewRow = {
  name: string
  source: string
  unit: string
  totalCo2: number
  postsAndSubPosts: string
}

type PreviewEmissionFactorsResult = { success: true; rows: PreviewRow[] } | { success: false; errors: ImportError[] }

const COLUMNS = {
  name: 0,
  attribute: 1,
  location: 2,
  source: 3,
  unit: 4,
  customUnit: 5,
  totalCo2: 6,
  co2f: 7,
  ch4f: 8,
  ch4b: 9,
  n2o: 10,
  co2b: 11,
  sf6: 12,
  hfc: 13,
  pfc: 14,
  otherGES: 15,
  reliability: 16,
  technicalRepresentativeness: 17,
  geographicRepresentativeness: 18,
  temporalRepresentativeness: 19,
  completeness: 20,
  postsAndSubPosts: 21,
  base: 22,
  comment: 23,
} as const

type ParsedRow = {
  name: string
  attribute: string | undefined
  location: string | undefined
  source: string
  unit: Unit
  customUnit: string | null
  totalCo2: number
  co2f: number | undefined
  ch4f: number | undefined
  ch4b: number | undefined
  n2o: number | undefined
  co2b: number | undefined
  sf6: number | undefined
  hfc: number | undefined
  pfc: number | undefined
  otherGES: number | undefined
  reliability: number
  technicalRepresentativeness: number
  geographicRepresentativeness: number
  temporalRepresentativeness: number
  completeness: number
  subPosts: Record<string, SubPost[]>
  comment: string | undefined
  isMonetary: boolean
  parts: []
  base: EmissionFactorBase | null
  rawPostsAndSubPosts: string
  rawUnit: string
}

type ParseResult = { success: true; rows: ParsedRow[] } | { success: false; errors: ImportError[] }

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
  const workbook = xlsx.parse(buffer, { raw: false })
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
      unit: command.unit as Unit,
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
