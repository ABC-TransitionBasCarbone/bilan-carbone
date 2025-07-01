// WIP DO NOT USE YET
import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { getQuestionsFromIdIntern } from '@/services/serverFunctions/question'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import { Question, QuestionType } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { Control, FieldErrors, UseFormWatch } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'
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
  const [questions, setQuestions] = useState<Question[]>([])

  const getQuestions = async () => {
    const res = await getQuestionsFromIdIntern(question.idIntern)
    if (res.success) {
      setQuestions(res.data.filter((question) => question.type !== QuestionType.TABLE))
    }
  }

  useEffect(() => {
    getQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.idIntern])

  const newRow = () =>
    ({ id: uuidv4(), ...Object.fromEntries(questions.map((question) => [question.idIntern, ''])) }) as Record<
      string,
      string
    >
  const tCutQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string>[]>([newRow()])

  // TO DO faire marcher le onChange quand la bdd sera adaptée aux tableaux
  // const handleChange = (value: string, id: string, key: string) => {
  //   setCurrentAnswers((prevAnswers) => {
  //     let hasChanged = false

  //     const newAnswers = prevAnswers.map((row) => {
  //       if (row.id !== id) return row

  //       if (row[key] === value) return row

  //       hasChanged = true
  //       return { ...row, [key]: value }
  //     })

  //     // onChange(newValues.map(row => row[key] || '').join(', '));
  //     return hasChanged ? newAnswers : prevAnswers
  //   })
  // }

  const handleDelete = (id: string) => {
    setCurrentAnswers((prevAnswers) => prevAnswers.filter((answerRow) => answerRow.id !== id))
    // TO DO faire marcher le onChange quand la bdd sera adaptée aux tableaux
    // onChange(currentAnswers.filter(answerRow => answerRow.id !== id).map(row =>
    //   row[questions[0].key] || ''
    // ).join(', '));
  }

  const columns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    const col = questions.map((question) => ({
      id: question.idIntern,
      header: question.label,
      accessorKey: question.idIntern,
      cell: ({ row, getValue }) => {
        // TODO utiliser question.unit dans les params de getQuestionFieldType ?
        const fieldType = getQuestionFieldType(question.type, question.unit)

        return (
          <FieldComponent
            autoSave={autoSave}
            fieldName={question.idIntern}
            fieldType={fieldType}
            question={question}
            key={`${question.idIntern}-${row.original.id}`}
            watch={watch}
            formErrors={formErrors}
            // TO DO faire marcher le onChange quand la bdd sera adaptée aux tableaux
            // value={getValue() as string}
            // onChange={(value) => handleChange(value || "", row.original.id, question.idIntern)}
            // onUpdate={handleUpdate}
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
          <Button title={tCutQuestions('delete')} aria-label="delete" onClick={() => handleDelete(row.original.id)}>
            <DeleteIcon />
          </Button>
        </Box>
      ),
    })

    return col
  }, [tCutQuestions, questions])

  const table = useReactTable<Record<string, string>>({
    columns,
    data: currentAnswers,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <Box>
      <Button className="align" onClick={() => setCurrentAnswers((prev) => [...prev, newRow()])}>
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
