// WIP DO NOT USE YET
import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteAnswerKeysFromRow } from '@/services/serverFunctions/answer'
import { getQuestionsFromIdIntern } from '@/services/serverFunctions/question'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Prisma, QuestionType } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Control, FieldErrors, UseFormWatch } from 'react-hook-form'
import Button from '../../base/Button'
import FieldComponent from '../FieldComponent'
import { getQuestionFieldType } from '../services/questionService'
import { BaseInputProps, FormValues } from '../types/formTypes'

interface Props extends Omit<BaseInputProps, 'value' | 'onChange' | 'onBlur'> {
  control: Control<FormValues>
  autoSave: UseAutoSaveReturn
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
}

const TableInput = ({ question, control, autoSave, watch, formErrors }: Props) => {
  const [questions, setQuestions] = useState<Prisma.QuestionGetPayload<{ include: { userAnswers: true } }>[]>([])
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>[]>([])
  const { callServerFunction } = useServerFunction()

  const getQuestions = async () => {
    const res = await getQuestionsFromIdIntern(question.idIntern)
    if (res.success) {
      setQuestions(res.data.filter((question) => question.type !== QuestionType.TABLE))
    }
  }

  const handleDelete = async (row: Record<string, string>) => {
    const indexToDelete = row.id
    setCurrentAnswers((prevAnswers) => prevAnswers.filter((answerRow) => answerRow.id !== indexToDelete))
    callServerFunction(() => deleteAnswerKeysFromRow(question.idIntern, indexToDelete))
  }

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    const col = questions.map((question) => ({
      id: question.idIntern,
      header: question.label,
      accessorKey: question.idIntern,
      cell: ({ row }) => {
        const fieldType = getQuestionFieldType(question.type, question.unit)
        return (
          <FieldComponent
            autoSave={autoSave}
            fieldName={`${question.idIntern}-${row.index}`}
            fieldType={fieldType}
            question={question}
            key={`${question.idIntern}-${row.index}`}
            watch={watch}
            formErrors={formErrors}
            control={control}
          />
        )
      },
    })) as ColumnDef<Record<string, string>>[]

    col.push({
      id: 'delete',
      header: tCutQuestions('actions'),
      accessorKey: 'id',
      cell: ({ row }) => (
        <Box>
          <Button title={tCutQuestions('delete')} aria-label="delete" onClick={() => handleDelete(row.original)}>
            <DeleteIcon />
          </Button>
        </Box>
      ),
    })

    return col
  }, [questions, tCutQuestions, autoSave, formErrors, control])

  const newRow = useCallback((index: number) => {
    const row = {
      id: index.toString(),
      ...Object.fromEntries(questions.map((question) => [question.idIntern, index])),
    } as Record<string, string>
    return row
  }, [])

  useEffect(() => {
    getQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.idIntern])

  useEffect(() => {
    if (questions.length !== 0) {
      const lengths = questions.flatMap(({ userAnswers }) => {
        return userAnswers.map(({ response }) => {
          if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
            return Object.keys(response).length
          }
          return 0
        })
      })

      const maxLength = Math.max(0, ...lengths)

      const current = []
      if (maxLength !== 0) {
        for (let i = 0; i <= maxLength; i++) {
          current.push(newRow(i))
        }
      } else {
        current.push(newRow(0))
      }

      setCurrentAnswers(current)
    }
  }, [questions])

  const table = useReactTable<Record<string, string>>({
    columns,
    data: currentAnswers,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => {
      return row.id
    },
  })

  return (
    <Box>
      <Button
        className="align"
        onClick={() => setCurrentAnswers((prev) => [...prev, newRow(currentAnswers.length + 1)])}
      >
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
