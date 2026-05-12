import xlsx from 'node-xlsx'

type ParseSheetError = { line: number; key: string }

export function parseExcelSheet(
  buffer: Buffer,
  options?: {
    headerRowIndex?: number
    rowFilter?: (row: unknown[], cellIndex: number, value: string) => boolean
    ignoredColumns?: number[]
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { success: false; errors: ParseSheetError[] } | { success: true; dataRows: any[][]; headerRowIndex: number } {
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

  const ignoredColumns = new Set(options?.ignoredColumns ?? [])
  const dataRows = sheet.data.slice(headerRowIndex + 1).filter((row) =>
    row.some((cell, i) => {
      if (ignoredColumns.has(i)) {
        return false
      }
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

  return { success: true, dataRows, headerRowIndex }
}
