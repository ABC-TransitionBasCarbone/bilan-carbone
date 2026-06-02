import { KG_CO2E_PREFIX_REGEX } from '@/constants/import'
import { LocaleType } from '@/i18n/config'
import { environmentPostMapping, environmentSubPostsMapping } from '@/services/posts'
import { EmissionFactorCommandValidation } from '@/services/serverFunctions/emissionFactor.command'
import { ImportWarning } from '@/types/import.types'
import { COLUMNS, ImportError, ParsedRow, ParseResult } from '@/types/importEmissionFactors.types'
import { EmissionFactorBase, Environment, SubPost, Unit } from '@abc-transitionbascarbone/db-common/enums'
import { ManualEmissionFactorUnitList } from './emissionFactors'
import { parseExcelSheet } from './excel.utils'
import {
  buildLabelMap,
  formatPrefixedUnitDisplay,
  matchLabelFromTranslations,
  matchUnitLabelFromTranslations,
} from './import.utils'
import { getExampleRowPrefixes } from './importEmissionSources.utils'
import { parseNumericValue } from './number'
import { getBcTranslations, getCommonTranslations, getSingularForm } from './translation.utils'

export function getAllPostsLabel(locale: LocaleType): string {
  return getBcTranslations(locale).emissionFactors.importModal.allPostsAndSubPosts
}

function matchBaseLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionFactorBase | null {
  return matchLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.base,
      () => true,
      (k) => k as EmissionFactorBase,
    ),
  )
}

function matchPostLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): string | null {
  const envPosts = environmentPostMapping[environment]
  return matchLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.post,
      (k) => k in envPosts,
      (k) => k,
    ),
  )
}

function matchSubPostLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
  environment: Environment,
): SubPost | null {
  const envSubPosts = Object.values(environmentSubPostsMapping[environment]).flat()
  return matchLabelFromTranslations(label, locale, (bc) =>
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

/**
 * Build a cell from a list of subposts for export following the format:
 * "Post1 : SubPost1 | SubPost2 || Post2 : SubPost3"
 * Returns the locale-specific all-posts label when all env subposts are covered.
 */
export function buildPostsAndSubPostsCell(subPosts: SubPost[], locale: LocaleType, environment: Environment): string {
  const subPostsByPost = environmentSubPostsMapping[environment] as Record<string, SubPost[]>
  const allEnvSubPosts = Object.values(subPostsByPost).flat()
  if (allEnvSubPosts.every((sp) => subPosts.includes(sp))) {
    return getAllPostsLabel(locale)
  }

  const postTranslations = getBcTranslations(locale).emissionFactors.post as unknown as Record<string, string>
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

function parseQuality(
  col: keyof typeof COLUMNS,
  errorKey: string,
  row: string[],
  locale: LocaleType,
  rowErrors: Omit<ImportError, 'lineNumber'>[],
): number | null {
  const raw = row[COLUMNS[col]]
  const value = matchLabelFromTranslations(raw, locale, (bc) =>
    Object.fromEntries(Object.entries(bc.quality).map(([k, v]) => [v.toLowerCase(), Number(k)] as [string, number])),
  )
  if (value === null) {
    rowErrors.push({ key: errorKey, value: String(raw ?? '') })
  }
  return value
}

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
  const trimmed = cell?.trim() ?? ''
  if (!trimmed || trimmed.toLowerCase() === getAllPostsLabel(locale).toLowerCase()) {
    const subPostsByPost = environmentSubPostsMapping[environment] as Record<string, SubPost[]>
    return { success: true, subPosts: subPostsByPost as Record<string, SubPost[]> }
  }

  const result: Record<string, SubPost[]> = {}
  const errors: ParseError[] = []
  const groups = String(cell)
    .split('||')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const group of groups) {
    const [postPart, ...subPostParts] = group.split(':').map((s) => s.trim())
    const post = matchPostLabelFromTranslations(postPart, locale, environment)
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
      const subPost = matchSubPostLabelFromTranslations(token, locale, environment)
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

export function parseImportFile(buffer: Buffer, locale: LocaleType, environment: Environment): ParseResult {
  const sheetResult = parseExcelSheet(buffer, {
    ignoredColumns: [COLUMNS.base],
    rowFilter: (_row, i, value) =>
      !(i === COLUMNS.postsAndSubPosts && value.toLowerCase() === getAllPostsLabel(locale).toLowerCase()),
  })
  if (!sheetResult.success) {
    return sheetResult
  }

  const { dataRows } = sheetResult

  const errors: ImportError[] = []
  const warnings: ImportWarning[] = []
  const parsedRows: ParsedRow[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const lineNumber = i + 2
    const rowErrors: Omit<ImportError, 'lineNumber'>[] = []
    const rowWarnings: ImportWarning[] = []

    const name = String(row[COLUMNS.name] ?? '').trim()
    if (!name) {
      rowErrors.push({ key: 'missingName' })
    } else if (getExampleRowPrefixes().some((prefix) => name.startsWith(prefix))) {
      continue
    }

    const source = String(row[COLUMNS.source] ?? '').trim()
    if (!source) {
      rowErrors.push({ key: 'missingSource' })
    }

    const rawUnit = String(row[COLUMNS.unit] ?? '').trim()

    const strippedUnit = rawUnit.replace(KG_CO2E_PREFIX_REGEX, '')
    const standardUnit = matchUnitLabelFromTranslations(strippedUnit, locale, ManualEmissionFactorUnitList)
    const unit = standardUnit ?? (strippedUnit ? Unit.CUSTOM : null)
    if (!unit) {
      rowErrors.push({ key: 'invalidUnit', value: rawUnit })
    } else if (standardUnit && rawUnit && !KG_CO2E_PREFIX_REGEX.test(rawUnit)) {
      rowWarnings.push({
        type: 'unitMissingPrefix',
        lineNumber,
        sourceName: name,
        foundUnit: rawUnit,
        resolvedValue: formatPrefixedUnitDisplay(locale, standardUnit),
      })
    }

    const customUnit = unit === Unit.CUSTOM ? strippedUnit || null : null

    const yesLabel = getCommonTranslations(locale).common.yes
    const isMonetary =
      unit === Unit.CUSTOM &&
      String(row[COLUMNS.isMonetary] ?? '')
        .trim()
        .toLowerCase() === yesLabel.toLowerCase()

    const rawTotalCo2 = row[COLUMNS.totalCo2]
    const totalCo2 = parseNumericValue(rawTotalCo2)
    if (totalCo2 === null || totalCo2 < 0) {
      rowErrors.push({ key: 'invalidTotalCo2' })
    }

    const reliability = parseQuality('reliability', 'invalidReliability', row, locale, rowErrors)
    const technicalRepresentativeness = parseQuality(
      'technicalRepresentativeness',
      'invalidTechnicalRepresentativeness',
      row,
      locale,
      rowErrors,
    )
    const geographicRepresentativeness = parseQuality(
      'geographicRepresentativeness',
      'invalidGeographicRepresentativeness',
      row,
      locale,
      rowErrors,
    )
    const temporalRepresentativeness = parseQuality(
      'temporalRepresentativeness',
      'invalidTemporalRepresentativeness',
      row,
      locale,
      rowErrors,
    )
    const completeness = parseQuality('completeness', 'invalidCompleteness', row, locale, rowErrors)

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
    const base = matchBaseLabelFromTranslations(rawBase, locale)

    if (flatSubPosts.includes(SubPost.Electricite) && !base) {
      rowErrors.push({ key: 'missingBase', value: rawBase || undefined })
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map((e) => ({ lineNumber, ...e })))
      continue
    }

    warnings.push(...rowWarnings)

    const command = {
      name,
      attribute: String(row[COLUMNS.attribute] ?? '').trim() || undefined,
      location: String(row[COLUMNS.location] ?? '').trim() || undefined,
      source,
      unit: unit!,
      customUnit: customUnit ?? undefined,
      isMonetary,
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
          lineNumber,
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

  if (parsedRows.length === 0) {
    return { success: false, errors: [{ lineNumber: null, key: 'noRows' }] }
  }

  return { success: true, rows: parsedRows, warnings }
}
