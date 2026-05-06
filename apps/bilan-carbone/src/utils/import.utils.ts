import { LocaleType } from '@/i18n/config'
import xlsx from 'node-xlsx'
import { BcTranslations, getBcTranslations } from './translation.utils'

type ParseSheetError = { line: number; key: string }

export function parseXlsxSheet(
  buffer: Buffer,
  options?: {
    headerRowIndex?: number
    rowFilter?: (row: unknown[], cellIndex: number, value: string) => boolean
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { success: false; errors: ParseSheetError[] } | { success: true; dataRows: any[][] } {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let workbook: ReturnType<typeof xlsx.parse<any[]>>
  try {
    workbook = xlsx.parse(buffer, { raw: false })
  } catch {
    return { success: false, errors: [{ line: 0, key: 'invalidFileType' }] }
  }

  const headerRowIndex = options?.headerRowIndex ?? 0
  const sheet = workbook[0]
  if (!sheet?.data || sheet.data.length < headerRowIndex + 2) {
    return { success: false, errors: [{ line: 0, key: 'emptyFile' }] }
  }

  const dataRows = sheet.data.slice(headerRowIndex + 1).filter((row) =>
    row.some((cell, i) => {
      const value = String(cell ?? '').trim()
      if (value === '') {
        return false
      }
      return options?.rowFilter ? options.rowFilter(row, i, value) : true
    }),
  )

  if (dataRows.length === 0) {
    return { success: false, errors: [{ line: 0, key: 'emptyFile' }] }
  }

  return { success: true, dataRows }
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

export function mapLabelFromTranslations<T>(
  label: string | undefined | null,
  locale: LocaleType,
  buildMap: (bc: BcTranslations) => Record<string, T>,
): T | null {
  if (!label) {
    return null
  }
  return buildMap(getBcTranslations(locale))[label.trim().toLowerCase()] ?? null
}

export function buildLabelMap<T extends string>(
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
