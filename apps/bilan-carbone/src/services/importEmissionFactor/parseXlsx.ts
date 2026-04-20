import * as XLSX from 'xlsx'
import { ImportEmissionFactor, numberColumns, validStatuses } from './import'

const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    return Number(value.replace(',', '.'))
  }
  return 0
}

export const parseSheetRows = (sheet: XLSX.WorkSheet): ImportEmissionFactor[] => {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: undefined })
  return raw
    .map((row) => {
      const normalizedRow: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.trim().replaceAll(' ', '_')
        normalizedRow[normalizedKey] =
          value === '' ? undefined : normalizedKey === "Identifiant_de_l'élément" ? String(value) : value
      }
      return normalizedRow
    })
    .filter((row) => {
      const status = row["Statut_de_l'élément"] as string | undefined
      return status && validStatuses.includes(status)
    })
    .map((row) => {
      const xlsxNumberFields = [...numberColumns, 'Incertitude'] as string[]
      for (const field of xlsxNumberFields) {
        if (row[field] !== undefined) {
          row[field] = parseNumber(row[field])
        }
      }
      return row as unknown as ImportEmissionFactor
    })
}
