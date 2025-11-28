import { TableAnswer } from '@/components/dynamic-form/types/formTypes'
import { MOBILITY_DOWNLOAD_MODEL_QUESTION_ID } from '@/constants/questions'
import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  getAnswerByQuestionIdAndStudySiteId,
  getParentTableQuestion,
  getQuestionsFromIdIntern,
} from '@/services/serverFunctions/question'
import { getQuestionLabel } from '@/utils/question'
import { isTableAnswer } from '@/utils/tableInput'
import { Prisma, Question, QuestionType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { Control, Controller, FieldError, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { MobilityDownloadModelQuestion } from './custom/MobilityDownloadModelQuestion'
import DatePickerInput from './inputFields/DatePickerInput'
import QCMInput from './inputFields/QCMInput'
import QCUInput from './inputFields/QCUInput'
import SelectInput from './inputFields/SelectInput'
import TableInput from './inputFields/TableInput'
import TextUnitInput from './inputFields/TextUnitInput'
import YearPickerInput from './inputFields/YearPickerInput'
import { FormValues } from './types/formTypes'
import { FieldType } from './types/questionTypes'

interface Props {
  fieldType: FieldType
  fieldName: string
  question: Question
  error?: FieldError
  isLoading?: boolean
  disabled?: boolean
  control: Control<FormValues>
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
  autoSave: UseAutoSaveReturn
  setValue: UseFormSetValue<FormValues>
  isTable?: boolean
  onTableFieldChange?: () => void
  studyStartDate: Date
}

const getCustomQuestionComponent = (question: Question) => {
  switch (question.idIntern) {
    case MOBILITY_DOWNLOAD_MODEL_QUESTION_ID:
      return MobilityDownloadModelQuestion
    default:
      return () => null
  }
}

const FieldComponent = ({
  fieldType,
  fieldName,
  question,
  control,
  error,
  isLoading,
  disabled,
  watch,
  formErrors,
  autoSave,
  setValue,
  isTable,
  onTableFieldChange,
  studyStartDate,
}: Props) => {
  const { callServerFunction } = useServerFunction()

  const tValidation = useTranslations('form.validation')
  const tFormat = useTranslations('emissionFactors.post.questions.format')

  const saveField = useCallback(
    async (value: unknown) => {
      if (!formErrors[fieldName]) {
        // Specific saving logic for table fields
        if (isTable && onTableFieldChange) {
          onTableFieldChange()
          return
        }

        let finalValue = value
        let targetQuestion = question

        if (ID_INTERN_PREFIX_REGEX.test(fieldName)) {
          const rowId = fieldName.startsWith(question.idIntern + '-')
            ? fieldName.substring(question.idIntern.length + 1)
            : null

          if (rowId) {
            const parentTableResponse = await getParentTableQuestion(question.id)
            if (parentTableResponse.success) {
              targetQuestion = parentTableResponse.data

              const response = await getAnswerByQuestionIdAndStudySiteId(targetQuestion.id, autoSave.studySiteId)
              let tableAnswer: TableAnswer = { rows: [] }

              if (
                response.success &&
                response.data &&
                response.data.response &&
                isTableAnswer(response.data.response)
              ) {
                tableAnswer = response.data.response
              }

              const updatedRows = tableAnswer.rows.map((row) => {
                if (row.id === rowId) {
                  return {
                    ...row,
                    data: {
                      ...row.data,
                      [question.idIntern]: value,
                    },
                  }
                }
                return row
              })

              if (!updatedRows.find((row) => row.id === rowId)) {
                const relatedQuestions = await callServerFunction(() =>
                  getQuestionsFromIdIntern(targetQuestion.idIntern),
                )

                if (!relatedQuestions.success) {
                  throw new Error(relatedQuestions.errorMessage)
                }

                const columnQuestions =
                  relatedQuestions.data?.filter((q: Question) => q.type !== QuestionType.TABLE) || []

                const newRow = {
                  id: rowId,
                  data: {} as Record<string, string>,
                }

                for (const columnQuestion of columnQuestions) {
                  newRow.data[columnQuestion.idIntern] = ''
                }

                newRow.data[question.idIntern] = value as string
                updatedRows.push(newRow)
              }

              finalValue = {
                ...tableAnswer,
                rows: updatedRows,
              }
            }
          }
        }

        autoSave.saveField(targetQuestion, finalValue as Prisma.InputJsonValue)
      }
    },
    [formErrors, fieldName, question, autoSave, callServerFunction, isTable, onTableFieldChange],
  )

  const baseInputProps = useMemo(() => {
    const label = getQuestionLabel(question.type, tFormat)
    return {
      question,
      label,
      errorMessage: error?.message ? tValidation(error.message) : undefined,
      disabled: isLoading || disabled,
    }
  }, [question, tValidation, error?.message, isLoading, disabled, tFormat])

  const renderField = useMemo(() => {
    const getInputComponent = () => {
      switch (fieldType) {
        case FieldType.TEXT:
        case FieldType.NUMBER:
          return TextUnitInput
        case FieldType.DATE:
          return DatePickerInput
        case FieldType.YEAR:
          return YearPickerInput
        case FieldType.SELECT:
          return SelectInput
        case FieldType.QCM:
          return QCMInput
        case FieldType.QCU:
          return QCUInput
        case FieldType.CUSTOM:
          return getCustomQuestionComponent(question)
        default:
          console.warn(`Unsupported question type: ${question.type} (mapped to: ${fieldType})`)
          return () => null
      }
    }

    if (fieldType === FieldType.TABLE) {
      return (
        <TableInput
          question={baseInputProps.question}
          label={baseInputProps.label}
          errorMessage={baseInputProps.errorMessage}
          disabled={baseInputProps.disabled}
          control={control}
          autoSave={autoSave}
          watch={watch}
          formErrors={formErrors}
          setValue={setValue}
          studyStartDate={studyStartDate}
        />
      )
    }

    const InputComponent = getInputComponent()

    return (
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...fieldWithoutRef } = field

          const handleFieldChange = (value: string | null) => {
            onChange(value)
            saveField(value)
          }

          return (
            <InputComponent
              {...fieldWithoutRef}
              ref={ref}
              onChange={handleFieldChange}
              value={field.value as string | null}
              question={baseInputProps.question}
              label={baseInputProps.label}
              errorMessage={baseInputProps.errorMessage}
              disabled={baseInputProps.disabled}
            />
          )
        }}
      />
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldType, fieldName, control, baseInputProps, question.type])

  return renderField
}

export default FieldComponent
