import BaseTable from '@/components/base/Table'
import { Paper, TableContainer } from '@mui/material'
import { EvaluatedFormElement, EvaluatedTableLayout, FormPageElementProp } from '@publicodes/forms'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useMemo } from 'react'
import InputField from './InputField'
import { getFormPageElementProp, OnFormInputChange } from './utils'

interface TableLayoutProps<RuleName extends string> {
  tableLayout: EvaluatedTableLayout<RuleName>
  onChange: OnFormInputChange<RuleName>
}

/**
 * Type representing a row in the table.
 * Each row contains the form elements for that row indexed by column.
 */
type TableRowData<RuleName extends string> = {
  id: string
  elements: Array<EvaluatedFormElement<RuleName> & FormPageElementProp>
}

export default function TableQuestion<RuleName extends string>({
  tableLayout: { title, headers, evaluatedRows },
  onChange,
}: TableLayoutProps<RuleName>) {
  const tableData = useMemo<TableRowData<RuleName>[]>(() => {
    return evaluatedRows.map((row, rowIndex) => ({
      id: `row-${rowIndex}`,
      elements: row,
    }))
  }, [evaluatedRows])

  const columns = useMemo<ColumnDef<TableRowData<RuleName>>[]>(() => {
    return headers.map((header, colIndex) => ({
      id: `col-${colIndex}`,
      header: () => header,
      cell: ({ row }) => {
        const formElement = row.original.elements[colIndex]
        if (!formElement) {
          return null
        }

        const formElementProps = getFormPageElementProp(formElement)

        // TODO: could we have a cleaner way to distinguish between value and inputs ?
        return <InputField formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
      },
    }))
  }, [headers, onChange])

  const table = useReactTable<TableRowData<RuleName>>({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <TableContainer component={Paper} className="mt1">
      <BaseTable table={table} testId={`table-${title}`} size="medium" />
    </TableContainer>
  )
}
