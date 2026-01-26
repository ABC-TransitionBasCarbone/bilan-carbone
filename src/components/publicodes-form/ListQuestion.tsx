import BaseTable from '@/components/base/Table'
import { usePublicodesForm } from '@/lib/publicodes/context'
import { Paper, TableContainer } from '@mui/material'
import { EvaluatedFormElement } from '@publicodes/forms'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { useCallback, useMemo } from 'react'
import InputField from './InputField'
import { EvaluatedListLayout } from './layouts/evaluatedFormLayout'
import { OnFieldChange } from './utils'

interface ListLayoutProps<RuleName extends string> {
  listLayout: EvaluatedListLayout<RuleName>
  onChange: OnFieldChange<RuleName>
}

/**
 * Type representing a row in the table.
 * Each row contains the form elements for that row indexed by column.
 */
type TableRowData<RuleName extends string> = {
  id: string
  situation: Situation<RuleName>
  elements: Array<EvaluatedFormElement<RuleName>>
}

export default function ListQuestion<RuleName extends string>({
  listLayout: { title, headers, targetRule, evaluatedListRows },
  onChange,
}: ListLayoutProps<RuleName>) {
  const tLayout = useTranslations('publicodes-layout.list')
  const { updateListLayoutSituation } = usePublicodesForm()

  const onListChange = useCallback(
    (situationId: string, ruleName: RuleName, value: string | number | boolean | undefined) => {
      updateListLayoutSituation(targetRule, situationId, ruleName, value)
    },
    [updateListLayoutSituation, targetRule],
  )

  const tableData = useMemo<TableRowData<RuleName>[]>(() => {
    return evaluatedListRows.map(({ id, situation, elements }) => ({
      id: `row-${id}`,
      situation,
      elements,
    }))
  }, [evaluatedListRows])

  const columns = useMemo<ColumnDef<TableRowData<RuleName>>[]>(() => {
    return headers.map((header, colIndex) => ({
      id: `col-${colIndex}`,
      header: () => tLayout(header),
      cell: ({ row }) => {
        const formElement = row.original.elements[colIndex]
        if (!formElement) {
          return null
        }
        const onChange = (ruleName: RuleName, value: string | number | boolean | undefined) => {
          onListChange(row.original.id.replace('row-', ''), ruleName, value)
        }
        return <InputField formElement={formElement} onChange={onChange} />
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
