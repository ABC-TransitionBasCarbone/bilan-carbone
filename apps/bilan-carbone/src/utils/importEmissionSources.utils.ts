import { KG_CO2E_PREFIX_REGEX } from '@/constants/import'
import { findEmissionFactorByIdForMatch } from '@/db/emissionFactors'
import { qualityKeys } from '@/services/uncertainty'
import { AmbiguousRow, FEChoices, ImportError, ImportWarning } from '@/types/import.types'
import { ParsedEmissionSourceRow, SOURCE_IMPORT_COLUMNS } from '@/types/importEmissionSources.types'
import {
  EmissionSourceCaracterisation,
  EmissionSourceType,
  Import,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import { Locale, LocaleType } from '@abc-transitionbascarbone/i18n/config'
import { getEmissionFactorFullName } from './emissionFactors'
import { parseExcelSheet } from './excel.utils'
import { EmissionFactorMatchType, findEmissionFactorMatch } from './findEmissionFactor.utils'
import {
  buildLabelMap,
  formatPrefixedUnitDisplayOptional,
  matchLabelFromMap,
  matchLabelFromTranslations,
  matchUnitLabelFromTranslations,
} from './import.utils'
import { parseNumericValue } from './number'
import { getBcTranslations, getCommonTranslations } from './translation.utils'

export const SOURCE_IMPORT_HEADER_ROW_INDEX = 9
const MAX_FE_CANDIDATES = 10

type StudySiteForImport = { id: string; site: { name: string } | null }

export function getImportEmissionSourcesTranslations(locale: LocaleType): Record<string, string> {
  const bc = getBcTranslations(locale)
  return bc.study.importEmissionSourcesModal
}

export function getExampleRowPrefixes(): string[] {
  return Object.values(Locale).flatMap((locale) => {
    const translations = getImportEmissionSourcesTranslations(locale)
    return translations.examplePrefix ? [translations.examplePrefix] : []
  })
}

function buildStudySiteNameMap(sites: StudySiteForImport[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const studySite of sites) {
    const name = studySite.site?.name
    if (name) {
      map[name.toLowerCase()] = studySite.id
    }
  }
  return map
}

function resolveStudySiteId(siteName: string, siteMap: Record<string, string>): string | null {
  return matchLabelFromMap(siteName, siteMap)
}

function matchTypeLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionSourceType | null {
  return matchLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionSource.type as Record<string, unknown>,
      () => true,
      (k) => k as EmissionSourceType,
    ),
  )
}

function matchCaracterisationLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionSourceCaracterisation | null {
  return matchLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.categorisations as Record<string, unknown>,
      () => true,
      (k) => k as EmissionSourceCaracterisation,
    ),
  )
}

function matchSubPostLabelFromTranslations(label: string | undefined | null, locale: LocaleType): SubPost | null {
  const subPostValues = new Set(Object.values(SubPost) as string[])
  return matchLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionFactors.post as unknown as Record<string, unknown>,
      (k) => subPostValues.has(k),
      (k) => k as SubPost,
    ),
  )
}

type ParseEmissionSourcesResult =
  | { success: true; rows: ParsedEmissionSourceRow[] }
  | { success: false; errors: ImportError[] }

function parseOptionalLabel<T>(
  label: string,
  errorKey: string,
  rowErrors: Omit<ImportError, 'lineNumber'>[],
  map: (label: string) => T | null,
): T | undefined {
  if (!label) {
    return undefined
  }
  const mapped = map(label)
  if (mapped === null) {
    rowErrors.push({ key: errorKey, value: label })
    return undefined
  }
  return mapped
}

function parseOptionalNumber(
  raw: string,
  errorKey: string,
  rowErrors: Omit<ImportError, 'lineNumber'>[],
): number | undefined {
  if (!raw) {
    return undefined
  }
  const parsed = parseNumericValue(raw)
  if (parsed === null) {
    rowErrors.push({ key: errorKey, value: raw })
    return undefined
  }
  return parsed
}

export function parseEmissionSourcesFile(
  buffer: Buffer,
  locale: LocaleType,
  studySites: StudySiteForImport[],
): ParseEmissionSourcesResult {
  const sheetResult = parseExcelSheet(buffer, {
    headerRowIndex: SOURCE_IMPORT_HEADER_ROW_INDEX,
    ignoredColumns: [SOURCE_IMPORT_COLUMNS.site, SOURCE_IMPORT_COLUMNS.post, SOURCE_IMPORT_COLUMNS.subPost],
  })

  if (!sheetResult.success) {
    return sheetResult
  }

  const { dataRows, headerRowIndex } = sheetResult
  const errors: ImportError[] = []
  const parsedRows: ParsedEmissionSourceRow[] = []
  const exampleRowPrefixes = getExampleRowPrefixes()
  const studySiteNameMap = buildStudySiteNameMap(studySites)

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[]
    const lineNumber = i + headerRowIndex + 2
    const rowErrors: Omit<ImportError, 'lineNumber'>[] = []

    const col = (key: keyof typeof SOURCE_IMPORT_COLUMNS) => String(row[SOURCE_IMPORT_COLUMNS[key]] ?? '').trim()

    const name = col('name')
    if (exampleRowPrefixes.some((prefix) => name.startsWith(prefix))) {
      continue
    }

    const siteName = col('site')
    const resolvedStudySiteId = siteName ? resolveStudySiteId(siteName, studySiteNameMap) : null
    if (!siteName) {
      rowErrors.push({ key: 'missingSite' })
    } else if (!resolvedStudySiteId) {
      rowErrors.push({ key: 'siteNotFound', value: siteName })
    }

    const subPostLabel = col('subPost')
    const subPost = matchSubPostLabelFromTranslations(subPostLabel, locale)
    if (!subPostLabel) {
      rowErrors.push({ key: 'missingSubPost' })
    } else if (!subPost) {
      rowErrors.push({ key: 'invalidSubPost', value: subPostLabel })
    }

    if (!name) {
      rowErrors.push({ key: 'missingName' })
    }

    const emissionFactorId = col('emissionFactorId') || undefined
    const emissionFactorName = col('emissionFactorName')

    const emissionFactorValue = parseOptionalNumber(col('emissionFactorValue'), 'invalidEmissionFactorValue', rowErrors)
    const rawEmissionFactorUnit = col('emissionFactorUnit')
    const strippedEmissionFactorUnit = rawEmissionFactorUnit.replace(KG_CO2E_PREFIX_REGEX, '')
    const matchedEmissionFactorUnit = strippedEmissionFactorUnit
      ? matchUnitLabelFromTranslations(strippedEmissionFactorUnit, locale, Object.values(Unit))
      : undefined
    if (strippedEmissionFactorUnit && matchedEmissionFactorUnit === null) {
      rowErrors.push({ key: 'invalidUnit', value: rawEmissionFactorUnit })
    }
    const emissionFactorUnit = matchedEmissionFactorUnit ?? undefined
    const unit = col('unit') || undefined
    const value = parseOptionalNumber(col('value'), 'invalidValue', rowErrors)
    const type = parseOptionalLabel(col('type'), 'invalidType', rowErrors, (label) =>
      matchTypeLabelFromTranslations(label, locale),
    )
    const caracterisation = parseOptionalLabel(col('caracterisation'), 'invalidCaracterisation', rowErrors, (label) =>
      matchCaracterisationLabelFromTranslations(label, locale),
    )

    const parsedQualities: Partial<Record<(typeof qualityKeys)[number], number>> = {}
    for (const field of qualityKeys) {
      const mapped = parseOptionalLabel(col(field), 'invalidQuality', rowErrors, (label) =>
        matchLabelFromTranslations(label, locale, (bc) =>
          Object.fromEntries(Object.entries(bc.quality).map(([k, v]) => [v.toLowerCase(), Number(k)])),
        ),
      )
      if (mapped !== undefined) {
        parsedQualities[field] = mapped
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map((e) => ({ lineNumber, ...e })))
      continue
    }

    parsedRows.push({
      lineNumber: lineNumber,
      studySiteId: resolvedStudySiteId!,
      siteName,
      subPost: subPost!,
      name,
      unit,
      emissionFactorId,
      emissionFactorName,
      emissionFactorValue,
      emissionFactorUnit,
      emissionFactorUnitRaw: rawEmissionFactorUnit || undefined,
      emissionFactorLocalization: col('emissionFactorLocalization') || undefined,
      value,
      type,
      caracterisation,
      tag: col('tag') || undefined,
      source: col('source') || undefined,
      comment: col('comment') || undefined,
      feComment: col('feComment') || undefined,
      validated: col('validation')
        ? col('validation').toLowerCase() === getCommonTranslations(locale).common.yes.toLowerCase()
        : undefined,
      depreciationPeriod: col('depreciationPeriod')
        ? (parseNumericValue(col('depreciationPeriod')) ?? undefined)
        : undefined,
      constructionYear: col('constructionYear') ? (parseNumericValue(col('constructionYear')) ?? undefined) : undefined,
      reliability: parsedQualities.reliability,
      technicalRepresentativeness: parsedQualities.technicalRepresentativeness,
      geographicRepresentativeness: parsedQualities.geographicRepresentativeness,
      temporalRepresentativeness: parsedQualities.temporalRepresentativeness,
      completeness: parsedQualities.completeness,
    })
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  if (parsedRows.length === 0) {
    return { success: false, errors: [{ lineNumber: null, key: 'noRows' }] }
  }

  return { success: true, rows: parsedRows }
}

type ResolvedEf = { efId: string; efName: string; efValue: string; efUnit: string }

export type ResolveEfRowsResult =
  | {
      type: 'warnings'
      warnings: ImportWarning[]
      ambiguousRows: AmbiguousRow[]
      resolvedByLine: Map<number, ResolvedEf>
    }
  | { type: 'ambiguous'; ambiguousRows: AmbiguousRow[] }
  | { type: 'resolved'; resolvedByLine: Map<number, ResolvedEf> }

type EmissionFactorMatch = NonNullable<Awaited<ReturnType<typeof findEmissionFactorMatch>>>

function collectWarningsAndAmbiguities(
  row: ParsedEmissionSourceRow,
  ef: EmissionFactorMatch | null,
  warnings: ImportWarning[],
  ambiguousRows: AmbiguousRow[],
  locale: LocaleType,
): void {
  const lineNumber = row.lineNumber

  if (
    row.emissionFactorUnitRaw &&
    row.emissionFactorUnit &&
    row.emissionFactorUnit !== Unit.CUSTOM &&
    !KG_CO2E_PREFIX_REGEX.test(row.emissionFactorUnitRaw)
  ) {
    warnings.push({
      type: 'unitMissingPrefix',
      lineNumber,
      sourceName: row.name,
      foundUnit: row.emissionFactorUnitRaw,
      resolvedValue: formatPrefixedUnitDisplayOptional(locale, row.emissionFactorUnit),
    })
  }

  if (!ef) {
    const hasSomeEfData = !!(row.emissionFactorId || row.emissionFactorName)
    if (hasSomeEfData) {
      const missingUnit = !!row.emissionFactorName && !row.emissionFactorUnit
      warnings.push({
        type: missingUnit ? 'efMissingUnit' : 'efNotFound',
        lineNumber,
        sourceName: row.name,
        searchedName: row.emissionFactorName,
        searchedValue: row.emissionFactorValue,
        searchedUnit: formatPrefixedUnitDisplayOptional(locale, row.emissionFactorUnit),
      })
    } else {
      warnings.push({ type: 'efMissing', lineNumber, sourceName: row.name })
    }
    return
  }

  if (ef.matchType === EmissionFactorMatchType.NameAmbiguous) {
    const tooMany = ef.candidates.length > MAX_FE_CANDIDATES
    ambiguousRows.push({
      lineNumber,
      sourceName: row.name,
      searchedName: row.emissionFactorName,
      searchedValue: row.emissionFactorValue,
      searchedUnit: formatPrefixedUnitDisplayOptional(locale, row.emissionFactorUnit),
      tooMany,
      candidates: tooMany
        ? []
        : ef.candidates.map((c) => ({
            id: c.id,
            foundTitle: c.foundTitle,
            foundValue: c.foundValue,
            foundUnit: formatPrefixedUnitDisplayOptional(locale, c.foundUnit),
          })),
    })
    return
  }

  if (ef.matchType !== EmissionFactorMatchType.Exact) {
    warnings.push({
      type: 'efNotFound',
      lineNumber,
      sourceName: row.name,
      searchedName: row.emissionFactorName,
      searchedValue: row.emissionFactorValue,
      searchedUnit: formatPrefixedUnitDisplayOptional(locale, row.emissionFactorUnit),
      foundTitle: ef.foundTitle,
      foundValue: ef.foundValue,
      foundUnit: formatPrefixedUnitDisplayOptional(locale, ef.foundUnit),
    })
  }
}

// Match each row to an emission factor: use choices if provided, otherwise auto-match and collect warnings/ambiguities
export async function resolveEmissionFactorRows(
  rows: ParsedEmissionSourceRow[],
  choices: FEChoices,
  locale: LocaleType,
  organizationId: string,
  versionIds: string[],
): Promise<ResolveEfRowsResult> {
  const hasChoices = Object.keys(choices).length > 0
  const warnings: ImportWarning[] = []
  const ambiguousRows: AmbiguousRow[] = []
  const resolvedByLine = new Map<number, ResolvedEf>()

  for (const row of rows) {
    const lineNumber = row.lineNumber

    if (lineNumber in choices) {
      const chosenId = choices[lineNumber]
      if (chosenId) {
        const chosenEf = await findEmissionFactorByIdForMatch(chosenId)
        if (chosenEf) {
          resolvedByLine.set(lineNumber, {
            efId: chosenEf.importedFrom === Import.Manual ? '' : (chosenEf.importedId ?? ''),
            efName:
              getEmissionFactorFullName(
                chosenEf.metaData.find((m) => m.language === locale) ??
                  chosenEf.metaData[0] ?? { title: null, attribute: null, frontiere: null },
              ) ||
              (row.emissionFactorName ?? ''),
            efValue: String(chosenEf.totalCo2),
            efUnit: formatPrefixedUnitDisplayOptional(locale, chosenEf.customUnit ?? chosenEf.unit ?? undefined),
          })
        }
      }
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
      row.emissionFactorLocalization,
    )

    if (!hasChoices) {
      collectWarningsAndAmbiguities(row, ef, warnings, ambiguousRows, locale)
    }

    if (ef && ef.matchType !== EmissionFactorMatchType.NameAmbiguous) {
      resolvedByLine.set(lineNumber, {
        efId: ef.importedFrom === Import.Manual ? '' : (ef.importedId ?? ''),
        efName: ef.foundTitle ?? '',
        efValue: String(ef.foundValue),
        efUnit: formatPrefixedUnitDisplayOptional(locale, ef.foundUnit),
      })
    }
  }

  if (warnings.length > 0) {
    return { type: 'warnings', warnings, ambiguousRows, resolvedByLine }
  }

  if (ambiguousRows.length > 0) {
    return { type: 'ambiguous', ambiguousRows }
  }

  return { type: 'resolved', resolvedByLine }
}
