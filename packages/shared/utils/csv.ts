type CsvBuildOptions = {
    separator?: string
}

export const serializeCsvValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return ''
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }

    return JSON.stringify(value)
}

export const encodeCsvField = (field: string, options?: CsvBuildOptions): string => {
    const separator = options?.separator ?? ';'
    const escaped = field.replace(/"/g, '""')
    if (escaped.includes(separator) || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped}"`
    }
    return escaped
}

export const buildCsv = (headers: string[], rows: string[][], options?: CsvBuildOptions): string => {
    const separator = options?.separator ?? ';'
    const headerRow = headers.map((header) => encodeCsvField(header, { separator })).join(separator)
    const contentRows = rows.map((row) => row.map((field) => encodeCsvField(field, { separator })).join(separator))
    return [headerRow, ...contentRows].join('\n')
}

export const sanitizeFileName = (name: string): string =>
    name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-_]/g, '')

/**
 * Serialize a record as "header\nvalues" using a plain separator format.
 * This intentionally does not escape separators to stay compatible with legacy readers
 * that parse with a naive split(';').
 */
export const serializeSimpleCsvRecord = (row: Record<string, unknown>, options?: CsvBuildOptions): string => {
    const separator = options?.separator ?? ';'
    const keys = Object.keys(row)
    const header = keys.join(separator)
    const values = keys.map((key) => serializeCsvValue(row[key])).join(separator)
    return `${header}\n${values}`
}
