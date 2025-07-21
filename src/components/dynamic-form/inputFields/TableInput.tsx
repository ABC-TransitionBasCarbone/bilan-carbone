import { emissionFactorMap } from '@/constants/emissionFactorMap'
import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import {
  getAnswerByQuestionIdAndStudySiteId,
  getParentTableQuestion,
  getQuestionsFromIdIntern,
} from '@/services/serverFunctions/question'
import { addTableRow, createFixedTableRow, deleteTableRow, isTableAnswer } from '@/utils/tableInput'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Prisma, QuestionType } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import Button from '../../base/Button'
import FieldComponent from '../FieldComponent'
import { getQuestionFieldType } from '../services/questionService'
import { BaseInputProps, FormValues, TableAnswer, TableRow as TableRowData } from '../types/formTypes'

interface Props extends Omit<BaseInputProps, 'value' | 'onChange' | 'onBlur'> {
  control: Control<FormValues>
  autoSave: UseAutoSaveReturn
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
  setValue: UseFormSetValue<FormValues>
}

const TableInput = ({ question, control, autoSave, watch, formErrors, setValue }: Props) => {
  const [questions, setQuestions] = useState<Prisma.QuestionGetPayload<{ include: { userAnswers: true } }>[]>([])
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const [tableAnswer, setTableAnswer] = useState<TableAnswer>({ rows: [] })

  const emissionFactorInfo = emissionFactorMap[question.idIntern]
  const isFixedTable = !!(emissionFactorInfo?.isFixed && emissionFactorInfo?.emissionFactors)

  const getQuestions = async () => {
    const res = await getQuestionsFromIdIntern(question.idIntern)
    if (res.success) {
      setQuestions(res.data.filter((question) => question.type !== QuestionType.TABLE))
    }
  }

  const handleDeleteRow = useCallback(
    async (rowId: string) => {
      const newTableAnswer = deleteTableRow(tableAnswer, rowId)
      setTableAnswer(newTableAnswer)
      autoSave.saveField(question, newTableAnswer as unknown as Prisma.InputJsonValue)
    },
    [tableAnswer, autoSave, question],
  )

  // Helper function to sync all form values back to table data while preserving pre-filled values
  const syncAllValuesToTableData = useCallback(() => {
    const updatedTableAnswer = {
      ...tableAnswer,
      rows: tableAnswer.rows.map((row, rowIndex) => {
        const updatedData = { ...row.data }
        questions.forEach((question, questionIndex) => {
          const fieldName = `${question.idIntern}-${row.id}`
          const currentValue = watch(fieldName)

          // For fixed tables, preserve the pre-filled select value which won't be updated manually
          if (isFixedTable && questionIndex === 0 && (!currentValue || currentValue === '')) {
            const selectQuestion = questions.find((q) => q.type === QuestionType.SELECT)
            if (selectQuestion && selectQuestion.possibleAnswers && selectQuestion.possibleAnswers[rowIndex]) {
              updatedData[question.idIntern] = selectQuestion.possibleAnswers[rowIndex]
            }
          } else if (currentValue !== undefined && currentValue !== null) {
            updatedData[question.idIntern] = String(currentValue)
          }
        })
        return {
          ...row,
          data: updatedData,
        }
      }),
    }
    return updatedTableAnswer
  }, [tableAnswer, questions, watch, isFixedTable])

  // Handle field changes for fixed tables to ensure pre-filled values are saved
  const handleTableFieldBlur = useCallback(() => {
    if (isFixedTable) {
      const updatedTableAnswer = syncAllValuesToTableData()
      autoSave.saveField(question, updatedTableAnswer as unknown as Prisma.InputJsonValue)
    }
  }, [isFixedTable, syncAllValuesToTableData, autoSave, question])

  const columns = useMemo<ColumnDef<TableRowData>[]>(() => {
    const col = questions.map((question, questionIndex) => ({
      id: question.idIntern,
      header: question.label,
      accessorKey: question.idIntern,
      cell: ({ row }) => {
        const fieldType = getQuestionFieldType(question.type, question.unit)
        const tableRow = row.original as TableRowData
        // For fixed tables, disable the first column (select field)
        const isFirstColumnInFixedTable = isFixedTable && questionIndex === 0
        return (
          <FieldComponent
            autoSave={autoSave}
            fieldName={`${question.idIntern}-${tableRow.id}`}
            fieldType={fieldType}
            question={question}
            key={`${question.idIntern}-${tableRow.id}`}
            watch={watch}
            formErrors={formErrors}
            control={control}
            setValue={setValue}
            disabled={isFirstColumnInFixedTable}
            onCustomBlur={isFixedTable ? handleTableFieldBlur : undefined}
            table={true}
          />
        )
      },
    })) as ColumnDef<TableRowData>[]

    // Only add delete column for non-fixed tables
    if (!isFixedTable) {
      col.push({
        id: 'delete',
        header: tCutQuestions('actions'),
        accessorKey: 'id',
        cell: ({ row }) => {
          const tableRow = row.original as TableRowData
          return (
            <Box>
              <Button
                title={tCutQuestions('delete')}
                aria-label="delete"
                color="error"
                onClick={() => handleDeleteRow(tableRow.id)}
              >
                Delete
              </Button>
            </Box>
          )
        },
      })
    }

    return col
  }, [
    questions,
    tCutQuestions,
    autoSave,
    watch,
    formErrors,
    control,
    handleDeleteRow,
    setValue,
    isFixedTable,
    handleTableFieldBlur,
  ])

  const populateFormFields = useCallback(
    (tableAnswer: TableAnswer) => {
      tableAnswer.rows.forEach((row) => {
        questions.forEach((question) => {
          const fieldName = `${question.idIntern}-${row.id}`
          const value = row.data[question.idIntern] || ''
          setValue(fieldName, value)
        })
      })
    },
    [questions, setValue],
  )

  const loadTableData = useCallback(async () => {
    if (questions.length === 0) {
      return
    }

    let existingTableAnswer: TableAnswer = { rows: [] }

    try {
      let tableQuestionId = question.id

      if (question.type !== QuestionType.TABLE) {
        const parentTableResponse = await getParentTableQuestion(question.id)
        if (parentTableResponse.success) {
          tableQuestionId = parentTableResponse.data.id
        }
      }

      const response = await getAnswerByQuestionIdAndStudySiteId(tableQuestionId, autoSave.studySiteId)

      if (response.success && response.data && response.data.response && isTableAnswer(response.data.response)) {
        existingTableAnswer = response.data.response
      }
    } catch (error) {
      console.error('Failed to load table data:', error)
    }

    if (existingTableAnswer.rows.length === 0) {
      if (isFixedTable) {
        // Create fixed rows based on first select question's possible answers
        const firstSelectQuestion = questions.find((q) => q.type === QuestionType.SELECT)
        if (firstSelectQuestion && firstSelectQuestion.possibleAnswers) {
          const fixedRows = firstSelectQuestion.possibleAnswers.map((possibleAnswer) =>
            createFixedTableRow(questions, possibleAnswer),
          )
          existingTableAnswer = { rows: fixedRows }
        }
      } else {
        existingTableAnswer = addTableRow(existingTableAnswer, questions)
      }
    }

    setTableAnswer(existingTableAnswer)

    populateFormFields(existingTableAnswer)
  }, [questions, question.id, question.type, autoSave.studySiteId, populateFormFields, isFixedTable])

  const handleAddRow = useCallback(() => {
    const updatedTableAnswer = syncAllValuesToTableData()
    const newTableAnswer = addTableRow(updatedTableAnswer, questions)
    setTableAnswer(newTableAnswer)

    populateFormFields(newTableAnswer)

    autoSave.saveField(question, newTableAnswer as unknown as Prisma.InputJsonValue)
  }, [syncAllValuesToTableData, questions, autoSave, question, populateFormFields])

  useEffect(() => {
    getQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.idIntern])

  useEffect(() => {
    if (questions.length > 0) {
      loadTableData()
    }
  }, [questions.length, loadTableData])

  const table = useReactTable<TableRowData>({
    columns,
    data: tableAnswer.rows,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => {
      return row.id
    },
  })

  return (
    <Box>
      {!isFixedTable && (
        <Button className="align" onClick={handleAddRow}>
          {tCutQuestions('add')}
        </Button>
      )}
      <TableContainer component={Paper} className="mt1">
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default TableInput
