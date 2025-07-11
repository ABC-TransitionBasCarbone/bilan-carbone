import { TableAnswer, TableRow } from '@/components/dynamic-form/types/formTypes'

export const isTableAnswer = (response: unknown): response is TableAnswer => {
  return (
    typeof response === 'object' &&
    response !== null &&
    !Array.isArray(response) &&
    'rows' in response &&
    Array.isArray((response as TableAnswer).rows)
  )
}

const generateUniqueRowId = (): string => {
  return `row-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

export const createNewTableRow = (questionColumns: Array<{ id: string; idIntern: string }>): TableRow => {
  const data: Record<string, string> = {}

  // Initialize empty values for each column
  for (const question of questionColumns) {
    data[question.idIntern] = ''
  }

  return {
    id: generateUniqueRowId(),
    data,
  }
}

/**
 * Create a fixed table row with pre-filled emission factor
 */
export const createFixedTableRow = (
  questionColumns: Array<{ id: string; idIntern: string }>,
  emissionFactorLabel: string,
): TableRow => {
  const data: Record<string, string> = {}

  for (const question of questionColumns) {
    data[question.idIntern] = ''
  }

  // Pre-fill the first select field with the emission factor label
  // This assumes the first column is the select field for the emission factor type
  if (questionColumns.length > 0) {
    data[questionColumns[0].idIntern] = emissionFactorLabel
  }

  return {
    id: generateUniqueRowId(),
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
  const newRow = createNewTableRow(questionColumns)

  return {
    ...tableAnswer,
    rows: [...tableAnswer.rows, newRow],
  }
}
