import BaseTable from '@abc-transitionbascarbone/components/src/base/Table'
import { usePublicodesTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import { Button } from '@abc-transitionbascarbone/ui'
import { ContentCopy, Delete } from '@mui/icons-material'
import { Box, IconButton, Paper, TableContainer } from '@mui/material'
import { EvaluatedFormElement } from '@publicodes/forms'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { Situation } from 'publicodes'
import { useCallback, useEffect, useMemo } from 'react'
import { usePublicodesForm } from '../context'
import { InputField } from './InputField'
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
  listLayout: { targetRule, evaluatedListRows, rules },
  onChange,
}: ListLayoutProps<RuleName>) {
  const tAction = useTranslations('common.action')
  const tStudyQuestions = useTranslations('study.questions')
  const { getQuestionTranslation: getQuestion } = usePublicodesTranslation()
  const { updateListLayoutSituation, createNewListLayoutSituation, deleteListLayoutSituation } = usePublicodesForm()

  useEffect(() => {
    if (evaluatedListRows.length === 0) {
      createNewListLayoutSituation(targetRule)
    }
  }, [evaluatedListRows, createNewListLayoutSituation, targetRule])

  const onListChange = useCallback(
    (situationId: string, ruleName: RuleName, value: string | number | boolean | undefined) => {
      updateListLayoutSituation(targetRule, situationId, ruleName, value)
    },
    [updateListLayoutSituation, targetRule],
  )

  const handleAddRow = useCallback(() => {
    createNewListLayoutSituation(targetRule)
  }, [createNewListLayoutSituation, targetRule])

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      deleteListLayoutSituation(targetRule, rowId)
    },
    [deleteListLayoutSituation, targetRule],
  )

  const handleDuplicateRow = useCallback(
    (rowId: string) => {
      createNewListLayoutSituation(targetRule, rowId)
    },
    [evaluatedListRows, createNewListLayoutSituation, targetRule],
  )

  const columns = useMemo<ColumnDef<TableRowData<RuleName>>[]>(() => {
    const columns: ColumnDef<TableRowData<RuleName>>[] = rules.map((rule, colIndex) => ({
      id: `col-${colIndex}`,
      header: () => getQuestion(rule),
      cell: ({ row }) => {
        const formElement = row.original.elements[colIndex]
        if (!formElement) {
          return null
        }

        const onChange = (ruleName: RuleName, value: string | number | boolean | undefined) => {
          onListChange(row.original.id, ruleName, value)
        }
        return <InputField key={`${row.id}-col-${formElement.id}`} formElement={formElement} onChange={onChange} />
      },
    }))

    const columnAction: ColumnDef<TableRowData<RuleName>> = {
      id: 'col-actions',
      header: () => tStudyQuestions('actions'),
      cell: ({ row }) => {
        const tableRow = row.original as TableRowData<RuleName>
        return (
          <Box display="flex">
            <IconButton
              title={tAction('duplicate')}
              aria-label="duplicate"
              color="primary"
              onClick={() => handleDuplicateRow(tableRow.id)}
            >
              <ContentCopy />
            </IconButton>
            <IconButton
              title={tAction('delete')}
              aria-label="delete"
              color="error"
              onClick={() => handleDeleteRow(tableRow.id)}
            >
              <Delete />
            </IconButton>
          </Box>
        )
      },
    }

    columns.push(columnAction)
    return columns
  }, [rules, onChange])

  const table = useReactTable<TableRowData<RuleName>>({
    data: evaluatedListRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <Box>
      <Button className="align" onClick={handleAddRow}>
        {tStudyQuestions('add')}
      </Button>
      <TableContainer component={Paper} className="mt1">
        <BaseTable table={table} testId={`table-${targetRule}`} size="medium" />
      </TableContainer>
    </Box>
  )
}
