import xlsx from 'node-xlsx'

type ParseSheetError = { lineNumber: number | null; key: string }

export const parseExcelSheet = (
  buffer: Buffer,
  options?: {
    firstHeader?: string
    rowFilter?: (row: unknown[], cellIndex: number, value: string) => boolean
    ignoredColumns?: number[]
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { success: false; errors: ParseSheetError[] } | { success: true; dataRows: any[][]; headerRowIndex: number } => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let workbook: ReturnType<typeof xlsx.parse<any[]>>
  try {
    workbook = xlsx.parse(buffer, { raw: true })
  } catch {
    return { success: false, errors: [{ lineNumber: null, key: 'invalidFileType' }] }
  }

  const sheet = workbook[0]

  if (!sheet?.data) {
    return { success: false, errors: [{ lineNumber: null, key: 'emptyFile' }] }
  }

  const headerRowIndex = options?.firstHeader ? sheet.data.findIndex((row) => row[0] === options.firstHeader) : 0

  if (headerRowIndex === -1) {
    return { success: false, errors: [{ lineNumber: null, key: 'emptyHeader' }] }
  }

  if (sheet.data.length < headerRowIndex + 2) {
    return { success: false, errors: [{ lineNumber: null, key: 'emptyFile' }] }
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
    return { success: false, errors: [{ lineNumber: null, key: 'emptyFile' }] }
  }

  return { success: true, dataRows, headerRowIndex }
}

export type Worksheet = {
  name: string
  data: unknown[][]
}
const getWorksheetRecords = (worksheet: Worksheet): Record<string, unknown>[] => {
  const [headers, ...rows] = worksheet.data
  if (!headers) {
    return []
  }

  const headerIndexes = new Map(headers.map((header, index) => [String(header).trim(), index]))
  return rows.map((row) => Object.fromEntries([...headerIndexes].map(([header, index]) => [header, row[index]])))
}

export const getRecords = (worksheets: Worksheet[], name: string) => {
  const worksheet = worksheets.find((item) => item.name.trim() === name)
  if (!worksheet) {
    throw new Error(`Missing ${name} sheet in training sessions file`)
  }
  return getWorksheetRecords(worksheet)
}
