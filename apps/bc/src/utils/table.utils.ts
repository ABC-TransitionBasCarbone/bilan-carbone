export const sortWithUpdatedAtFallback = (
  rowA: { original: { updatedAt: string }; getValue: (columnId: string) => unknown },
  rowB: { original: { updatedAt: string }; getValue: (columnId: string) => unknown },
  columnId: string,
): number => {
  const a = (rowA.getValue(columnId) as number | null | undefined) ?? null
  const b = (rowB.getValue(columnId) as number | null | undefined) ?? null

  if (a !== b) {
    if (a === null) {
      return 1
    }
    if (b === null) {
      return -1
    }
    return a < b ? -1 : 1
  }

  return new Date(rowB.original.updatedAt).getTime() - new Date(rowA.original.updatedAt).getTime()
}
