import { LocaleType } from '@/i18n/config'
import { environmentPostMapping, environmentSubPostsMapping } from '@/services/posts'
import { EmissionFactorCommandValidation } from '@/services/serverFunctions/emissionFactor.command'
import { COLUMNS, ImportError, ParsedRow, ParseResult } from '@/types/importEmissionFactors.types'
import { EmissionFactorBase, Environment, SubPost, Unit } from '@repo/db-common/enums'
import xlsx from 'node-xlsx'
import { ManualEmissionFactorUnitList } from './emissionFactors'
import { parseNumericValue } from './number'
import { BcTranslations, extractAllForms, getBcTranslations, getSingularForm } from './translation.utils'

/**
 * Map a string label coming from the import file to a value of the right type
 * based on the translations file.
 */
function mapLabelFromTranslations<T>(
  label: string | undefined | null,
  locale: LocaleType,
  buildMap: (bc: BcTranslations) => Record<string, T>,
): T | null {
  if (!label) {
    return null
  }
  return buildMap(getBcTranslations(locale))[label.trim().toLowerCase()] ?? null
}

function buildLabelMap<T extends string>(
  entries: Record<string, unknown>,
  keyFilter: (k: string) => boolean,
  toValue: (k: string) => T,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(entries)
      .filter(([k, v]) => keyFilter(k) && typeof v === 'string')
      .map(([k, v]) => [(v as string).toLowerCase(), toValue(k)]),
  )
}

export function mapBaseLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionFactorBase | null {
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.base,
      () => true,
      (k) => k as EmissionFactorBase,
    ),
  )
}

export function mapQualityLabelFromTranslations(label: string | undefined | null, locale: LocaleType): number | null {
  if (!label) {
    return null
  }
  const bc = getBcTranslations(locale)
  const map = Object.fromEntries(
    Object.entries(bc.quality)
      .filter(([k]) => /^[1-5]$/.test(k))
      .map(([k, v]) => [v.toLowerCase(), Number(k)]),
  )
  return map[String(label).trim().toLowerCase()] ?? null
}

export function mapPostLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): string | null {
  const envPosts = environmentPostMapping[environment]
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.post,
      (k) => k in envPosts,
      (k) => k,
    ),
  )
}

export function mapSubPostLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): SubPost | null {
  const envSubPosts = Object.values(environmentSubPostsMapping[environment]).flat()
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.post,
      (k) => envSubPosts.includes(k as SubPost),
      (k) => k as SubPost,
    ),
  )
}

export function getUnitLabel(unit: Unit, locale: LocaleType): string {
  const raw = (getBcTranslations(locale).units as Record<string, string>)[unit]
  if (!raw) {
    return unit
  }
  return getSingularForm(raw)
}

function buildUnitLabelMap(bc: BcTranslations): Record<string, Unit> {
  const entries: [string, Unit][] = []
  for (const unit of ManualEmissionFactorUnitList) {
    const raw = (bc.units as Record<string, string>)[unit]
    if (!raw) {
      continue
    }
    for (const form of extractAllForms(raw)) {
      entries.push([form.toLowerCase(), unit])
    }
  }
  return Object.fromEntries(entries)
}

export function mapUnitLabelFromTranslations(label: string | undefined | null, locale: LocaleType): Unit | null {
  return mapLabelFromTranslations(label, locale, buildUnitLabelMap)
}

/**
 * Build a cell from a list of subposts for export following the format:
 * "Post1 : SubPost1 | SubPost2 || Post2 : SubPost3"
 */
export function buildPostsAndSubPostsCell(subPosts: SubPost[], locale: LocaleType, environment: Environment): string {
  const postTranslations = getBcTranslations(locale).emissionFactors.post as unknown as Record<string, string>
  const subPostsByPost = environmentSubPostsMapping[environment] as Record<string, SubPost[]>
  const envPosts = environmentPostMapping[environment]

  const groups: string[] = []
  for (const post of Object.values(envPosts)) {
    const allowed = subPostsByPost[post as string] ?? []
    const matching = subPosts.filter((sp) => allowed.includes(sp))
    if (matching.length === 0) {
      continue
    }
    const postLabel = postTranslations[post as string] ?? (post as string)
    const subPostLabels = matching.map((sp) => postTranslations[sp] ?? sp).join(' | ')
    groups.push(`${postLabel} : ${subPostLabels}`)
  }
  return groups.join(' || ')
}

type ParseError = { key: string; value?: string }

export type ParsePostsResult =
  | { success: true; subPosts: Record<string, SubPost[]> }
  | { success: false; errors: ParseError[] }

// Format: "Post1 : SubPost1 | SubPost2 || Post2 : SubPost3"
// || separates post groups, | separates subposts within a group, : binds post to its first subpost
export function parsePostsAndSubPostsCell(
  cell: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): ParsePostsResult {
  if (!cell) {
    return { success: false, errors: [{ key: 'missingPostsAndSubPosts' }] }
  }
  const result: Record<string, SubPost[]> = {}
  const errors: ParseError[] = []
  const groups = String(cell)
    .split('||')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const group of groups) {
    const [postPart, ...subPostParts] = group.split(':').map((s) => s.trim())
    const post = mapPostLabelFromTranslations(postPart, locale, environment)
    if (!post) {
      errors.push({ key: 'invalidPost', value: postPart })
      continue
    }
    const subPostTokens = subPostParts
      .join(':')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean)
    for (const token of subPostTokens) {
      const subPost = mapSubPostLabelFromTranslations(token, locale, environment)
      if (!subPost) {
        errors.push({ key: 'invalidSubPost', value: token })
      } else {
        result[post] = [...(result[post] ?? []), subPost]
      }
    }
    if (subPostTokens.length === 0) {
      errors.push({ key: 'missingSubPosts', value: postPart })
    }
  }
  if (errors.length > 0) {
    return { success: false, errors }
  }
  return { success: true, subPosts: result }
}

function parseSheet(
  buffer: Buffer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { success: false; errors: ImportError[] } | { success: true; dataRows: any[][] } {
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

  const dataRows = sheet.data.slice(1).filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))

  if (dataRows.length === 0) {
    return { success: false, errors: [{ line: 0, key: 'emptyFile' }] }
  }

  return { success: true, dataRows }
}

export function parseImportFile(buffer: Buffer, locale: LocaleType, environment: Environment): ParseResult {
  const sheetResult = parseSheet(buffer)
  if (!sheetResult.success) {
    return sheetResult
  }

  const { dataRows } = sheetResult

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
