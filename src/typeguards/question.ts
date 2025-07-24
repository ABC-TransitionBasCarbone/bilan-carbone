export type TableResponseRow = {
  id: string
  data: Record<string, unknown>
}

export type TableResponse = {
  rows: TableResponseRow[]
}

export function isTableResponse(response: unknown): response is TableResponse {
  if (typeof response !== 'object' || response === null) {
    return false
  }

  const r = response as { rows?: unknown }

  if (!Array.isArray(r.rows)) {
    return false
  }

  return r.rows.every((row): row is TableResponseRow => {
    if (typeof row !== 'object' || row === null) {
      return false
    }

    const id = (row as { id?: unknown }).id
    const data = (row as { data?: unknown }).data

    return typeof id === 'string' && typeof data === 'object' && data !== null && !Array.isArray(data)
  })
}
