import { LocaleType } from '@/i18n/config'
import { qualityKeys } from '@/services/uncertainty'
import {
  ImportEmissionSourceError,
  ParsedEmissionSourceRow,
  ParseEmissionSourcesResult,
  SOURCE_IMPORT_COLUMNS,
} from '@/types/importEmissionSources.types'
import { EmissionSourceCaracterisation, EmissionSourceType, SubPost } from '@repo/db-common/enums'
import {
  buildLabelMap,
  mapLabelFromTranslations,
  mapQualityLabelFromTranslations,
  parseXlsxSheet,
} from './import.utils'
import { parseNumericValue } from './number'

export function mapTypeLabelFromTranslations(
  label: string | undefined | null,
  locale: LocaleType,
): EmissionSourceType | null {
  return mapLabelFromTranslations(label, locale, (bc) =>
    buildLabelMap(
      bc.emissionSource.type as Record<string, unknown>,
      () => true,
      (k) => k as EmissionSourceType,
    ),
  )
}

export function mapCaracterisationLabelFromTranslations(
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

export function mapSubPostLabelFromTranslations(label: string | undefined | null, locale: LocaleType): SubPost | null {
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
  const sheetResult = parseXlsxSheet(buffer, { headerRowIndex: 4 })
  if (!sheetResult.success) {
    return sheetResult
  }

  const { dataRows } = sheetResult
  const errors: ImportEmissionSourceError[] = []
  const parsedRows: ParsedEmissionSourceRow[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[]
    const lineNum = i + 2
    const rowErrors: Omit<ImportEmissionSourceError, 'line'>[] = []

    const col = (key: keyof typeof SOURCE_IMPORT_COLUMNS) => String(row[SOURCE_IMPORT_COLUMNS[key]] ?? '').trim()

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

    const name = col('name')
    if (!name) {
      rowErrors.push({ key: 'missingName' })
    }

    const emissionFactorName = col('emissionFactorName')
    if (!emissionFactorName) {
      rowErrors.push({ key: 'missingEmissionFactorName' })
    }

    const rawEfValueStr = col('emissionFactorValue')
    let emissionFactorValue: number | undefined = undefined
    if (!rawEfValueStr) {
      rowErrors.push({ key: 'missingEmissionFactorValue' })
    } else {
      const parsed = parseNumericValue(rawEfValueStr)
      if (parsed === null) {
        rowErrors.push({ key: 'invalidEmissionFactorValue', value: rawEfValueStr })
      } else {
        emissionFactorValue = parsed
      }
    }

    const emissionFactorUnit = col('emissionFactorUnit')
    if (!emissionFactorUnit) {
      rowErrors.push({ key: 'missingEmissionFactorUnit' })
    }

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
      emissionFactorName,
      emissionFactorValue: emissionFactorValue!,
      emissionFactorUnit,
      value,
      type,
      caracterisation,
      tag: col('tag') || undefined,
      source: col('source') || undefined,
      comment: col('comment') || undefined,
      feComment: col('feComment') || undefined,
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

  return { success: true, rows: parsedRows }
}
