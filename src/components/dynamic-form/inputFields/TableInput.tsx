import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import {
  getAnswerByQuestionIdAndStudySiteId,
  getParentTableQuestion,
  getQuestionsFromIdIntern,
} from '@/services/serverFunctions/question'
import { addTableRow, deleteTableRow, isTableAnswer } from '@/utils/tableInput'
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

  const columns = useMemo<ColumnDef<TableRowData>[]>(() => {
    const col = questions.map((question) => ({
      id: question.idIntern,
      header: question.label,
      accessorKey: question.idIntern,
      cell: ({ row }) => {
        const fieldType = getQuestionFieldType(question.type, question.unit)
        const tableRow = row.original as TableRowData
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
          />
        )
      },
    })) as ColumnDef<TableRowData>[]

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

    return col
  }, [questions, tCutQuestions, autoSave, watch, formErrors, control, handleDeleteRow, setValue])

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
      existingTableAnswer = addTableRow(existingTableAnswer, questions)
    }

    setTableAnswer(existingTableAnswer)

    populateFormFields(existingTableAnswer)
  }, [questions, question.id, question.type, autoSave.studySiteId, populateFormFields])

  const handleAddRow = useCallback(() => {
    const updatedTableAnswer = {
      ...tableAnswer,
      rows: tableAnswer.rows.map((row) => {
        const updatedData = { ...row.data }
        questions.forEach((question) => {
          const fieldName = `${question.idIntern}-${row.id}`
          const currentValue = watch(fieldName)
          if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
            updatedData[question.idIntern] = String(currentValue)
          }
        })
        return {
          ...row,
          data: updatedData,
        }
      }),
    }

    const newTableAnswer = addTableRow(updatedTableAnswer, questions)
    setTableAnswer(newTableAnswer)

    populateFormFields(newTableAnswer)

    autoSave.saveField(question, newTableAnswer as unknown as Prisma.InputJsonValue)
  }, [tableAnswer, questions, autoSave, question, populateFormFields, watch])

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
      <Button className="align" onClick={handleAddRow}>
        {tCutQuestions('add')}
      </Button>
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
