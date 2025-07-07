import { TableAnswer, TableRow } from '@/components/dynamic-form/types/formTypes'

/**
 * Check if an answer response is in table format
 */
export const isTableAnswer = (response: unknown): response is TableAnswer => {
  return (
    typeof response === 'object' &&
    response !== null &&
    !Array.isArray(response) &&
    'rows' in response &&
    Array.isArray((response as TableAnswer).rows)
  )
}

/**
 * Generate a unique row ID that doesn't conflict with existing ones
 */
const generateUniqueRowId = (): string => {
  return `row-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Create a new empty table row
 */
export const createNewTableRow = (
  index: number,
  questionColumns: Array<{ id: string; idIntern: string }>,
): TableRow => {
  const data: Record<string, string> = {}

  // Initialize empty values for each column
  for (const question of questionColumns) {
    data[question.idIntern] = ''
  }

  return {
    id: generateUniqueRowId(),
    index,
    data,
  }
}

/**
 * Update a specific cell in a table row
 */
export const updateTableCell = (
  tableAnswer: TableAnswer,
  rowId: string,
  columnQuestionId: string,
  value: string,
): TableAnswer => {
  const updatedRows = tableAnswer.rows.map((row) => {
    if (row.id === rowId) {
      return {
        ...row,
        data: {
          ...row.data,
          [columnQuestionId]: value,
        },
      }
    }
    return row
  })

  return {
    ...tableAnswer,
    rows: updatedRows,
  }
}

/**
 * Delete a row from table answer
 */
export const deleteTableRow = (tableAnswer: TableAnswer, rowId: string): TableAnswer => {
  const updatedRows = tableAnswer.rows.filter((row) => row.id !== rowId)

  return {
    ...tableAnswer,
    rows: updatedRows,
  }
}

/**
 * Add a new row to table answer
 */
export const addTableRow = (
  tableAnswer: TableAnswer,
  questionColumns: Array<{ id: string; idIntern: string }>,
): TableAnswer => {
  let newIndex = 0
  if (tableAnswer.rows.length > 0) {
    newIndex = Math.max(...tableAnswer.rows.map((row) => row.index)) + 1
  }
  const newRow = createNewTableRow(newIndex, questionColumns)
  console.log({ newIndex })
  console.log({ newRow })

  return {
    ...tableAnswer,
    rows: [...tableAnswer.rows, newRow],
  }
}
