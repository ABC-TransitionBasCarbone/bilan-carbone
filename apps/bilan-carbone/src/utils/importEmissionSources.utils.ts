import { KG_CO2E_PREFIX_REGEX } from '@/constants/import'
import { Locale, LocaleType } from '@/i18n/config'
import { qualityKeys } from '@/services/uncertainty'
import { ImportError } from '@/types/import.types'
import { ParsedEmissionSourceRow, SOURCE_IMPORT_COLUMNS } from '@/types/importEmissionSources.types'
import {
  EmissionSourceCaracterisation,
  EmissionSourceType,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import { parseExcelSheet } from './excel.utils'
import { buildLabelMap, mapLabelFromTranslations, mapUnitLabelFromTranslationsWithList } from './import.utils'
import { parseNumericValue } from './number'
import { getBcTranslations, getCommonTranslations } from './translation.utils'

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

function mapTypeLabelFromTranslations(label: string | undefined | null, locale: LocaleType): EmissionSourceType | null {
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionSource.type as Record<string, unknown>,
      () => true,
      (k) => k as EmissionSourceType,
    ),
  )
}

function mapCaracterisationLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionSourceCaracterisation | null {
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.categorisations as Record<string, unknown>,
      () => true,
      (k) => k as EmissionSourceCaracterisation,
    ),
  )
}

function mapSubPostLabelFromTranslations(label: string | undefined | null, locale: LocaleType): SubPost | null {
  const subPostValues = new Set(Object.values(SubPost) as string[])
  return mapLabelFromTranslations(label, locale, (bc) =>
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
  rowErrors: Omit<ImportError, 'line'>[],
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
  rowErrors: Omit<ImportError, 'line'>[],
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

export function parseEmissionSourcesFile(buffer: Buffer, locale: LocaleType): ParseEmissionSourcesResult {
  const sheetResult = parseExcelSheet(buffer, {
    headerRowIndex: 9,
    ignoredColumns: [SOURCE_IMPORT_COLUMNS.site, SOURCE_IMPORT_COLUMNS.post, SOURCE_IMPORT_COLUMNS.subPost],
  })

  if (!sheetResult.success) {
    return sheetResult
  }

  const { dataRows, headerRowIndex } = sheetResult
  const errors: ImportError[] = []
  const parsedRows: ParsedEmissionSourceRow[] = []
  const exampleRowPrefixes = getExampleRowPrefixes()

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[]
    const lineNum = i + headerRowIndex + 2
    const rowErrors: Omit<ImportError, 'line'>[] = []

    const col = (key: keyof typeof SOURCE_IMPORT_COLUMNS) => String(row[SOURCE_IMPORT_COLUMNS[key]] ?? '').trim()

    const name = col('name')
    if (exampleRowPrefixes.some((prefix) => name.startsWith(prefix))) {
      continue
    }

    const siteName = col('site')
    if (!siteName) {
      rowErrors.push({ key: 'missingSite' })
    }

    const subPostLabel = col('subPost')
    const subPost = mapSubPostLabelFromTranslations(subPostLabel, locale)
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
    const emissionFactorUnit = parseOptionalLabel(strippedEmissionFactorUnit, 'invalidUnit', rowErrors, (label) =>
      mapUnitLabelFromTranslationsWithList(label, locale, Object.values(Unit)),
    )
    const unit = col('unit') || undefined
    const value = parseOptionalNumber(col('value'), 'invalidValue', rowErrors)
    const type = parseOptionalLabel(col('type'), 'invalidType', rowErrors, (label) =>
      mapTypeLabelFromTranslations(label, locale),
    )
    const caracterisation = parseOptionalLabel(col('caracterisation'), 'invalidCaracterisation', rowErrors, (label) =>
      mapCaracterisationLabelFromTranslations(label, locale),
    )

    const parsedQualities: Partial<Record<(typeof qualityKeys)[number], number>> = {}
    for (const field of qualityKeys) {
      const mapped = parseOptionalLabel(col(field), 'invalidQuality', rowErrors, (label) =>
        mapLabelFromTranslations(label, locale, (bc) =>
          Object.fromEntries(Object.entries(bc.quality).map(([k, v]) => [v.toLowerCase(), Number(k)])),
        ),
      )
      if (mapped !== undefined) {
        parsedQualities[field] = mapped
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map((e) => ({ line: lineNum, ...e })))
      continue
    }

    parsedRows.push({
      lineNumber: lineNum,
      siteName,
      subPost: subPost!,
      name,
      unit,
      emissionFactorId,
      emissionFactorName,
      emissionFactorValue,
      emissionFactorUnit,
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
    return { success: false, errors: [{ line: 0, key: 'noRows' }] }
  }

  return { success: true, rows: parsedRows }
}
