import { Locale, LocaleType } from '@/i18n/config'
import { qualityKeys } from '@/services/uncertainty'
import {
  ImportEmissionSourceError,
  ParsedEmissionSourceRow,
  ParseEmissionSourcesResult,
  SOURCE_IMPORT_COLUMNS,
} from '@/types/importEmissionSources.types'
import {
  EmissionSourceCaracterisation,
  EmissionSourceType,
  SubPost,
  Unit,
} from '@abc-transitionbascarbone/db-common/enums'
import { parseExcelSheet } from './excel.utils'
import {
  buildLabelMap,
  mapLabelFromTranslations,
  mapQualityLabelFromTranslations,
  mapUnitLabelFromTranslationsWithList,
} from './import.utils'
import { parseNumericValue } from './number'
import { getBcTranslations } from './translation.utils'

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

export function parseEmissionSourcesFile(buffer: Buffer, locale: LocaleType): ParseEmissionSourcesResult {
  const sheetResult = parseExcelSheet(buffer, {
    headerRowIndex: 4,
    ignoredColumns: [SOURCE_IMPORT_COLUMNS.site, SOURCE_IMPORT_COLUMNS.post, SOURCE_IMPORT_COLUMNS.subPost],
  })

  if (!sheetResult.success) {
    return sheetResult
  }

  const { dataRows, headerRowIndex } = sheetResult
  const errors: ImportEmissionSourceError[] = []
  const parsedRows: ParsedEmissionSourceRow[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[]
    const lineNum = i + headerRowIndex + 2
    const rowErrors: Omit<ImportEmissionSourceError, 'line'>[] = []

    const col = (key: keyof typeof SOURCE_IMPORT_COLUMNS) => String(row[SOURCE_IMPORT_COLUMNS[key]] ?? '').trim()

    const name = col('name')
    if (getExampleRowPrefixes().some((prefix) => name.startsWith(prefix))) {
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
    if (!emissionFactorName && !emissionFactorId) {
      rowErrors.push({ key: 'missingEmissionFactorName' })
    }

    const rawEfValueStr = col('emissionFactorValue')
    let emissionFactorValue: number | undefined = undefined
    if (rawEfValueStr) {
      const parsed = parseNumericValue(rawEfValueStr)
      if (parsed === null) {
        rowErrors.push({ key: 'invalidEmissionFactorValue', value: rawEfValueStr })
      } else {
        emissionFactorValue = parsed
      }
    }

    const emissionFactorUnitLabel = col('emissionFactorUnit')
    let emissionFactorUnit: string | undefined = undefined
    if (emissionFactorUnitLabel) {
      const mapped = mapUnitLabelFromTranslationsWithList(emissionFactorUnitLabel, locale, Object.values(Unit))
      if (!mapped) {
        rowErrors.push({ key: 'invalidUnit', value: emissionFactorUnitLabel })
      } else {
        emissionFactorUnit = mapped
      }
    }

    const unit = col('unit') || undefined

    const rawValueStr = col('value')
    let value: number | undefined = undefined
    if (rawValueStr) {
      const parsed = parseNumericValue(rawValueStr)
      if (parsed === null) {
        rowErrors.push({ key: 'invalidValue', value: rawValueStr })
      } else {
        value = parsed
      }
    }

    const typeLabel = col('type')
    let type: EmissionSourceType | undefined = undefined
    if (typeLabel) {
      const mapped = mapTypeLabelFromTranslations(typeLabel, locale)
      if (!mapped) {
        rowErrors.push({ key: 'invalidType', value: typeLabel })
      } else {
        type = mapped
      }
    }

    const caracterisationLabel = col('caracterisation')
    let caracterisation: EmissionSourceCaracterisation | undefined = undefined
    if (caracterisationLabel) {
      const mapped = mapCaracterisationLabelFromTranslations(caracterisationLabel, locale)
      if (!mapped) {
        rowErrors.push({ key: 'invalidCaracterisation', value: caracterisationLabel })
      } else {
        caracterisation = mapped
      }
    }

    const parsedQualities: Partial<Record<(typeof qualityKeys)[number], number>> = {}
    for (const field of qualityKeys) {
      const label = col(field)
      if (label) {
        const mapped = mapQualityLabelFromTranslations(label, locale)
        if (mapped === null) {
          rowErrors.push({ key: 'invalidQuality', value: label })
        } else {
          parsedQualities[field] = mapped
        }
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors.map((e) => ({ line: lineNum, ...e })))
      continue
    }

    parsedRows.push({
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
      validated: col('validation') ? col('validation') === getBcTranslations(locale).study.export.yes : undefined,
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
