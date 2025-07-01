import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { getQuestionLabel } from '@/utils/question'
import { Prisma, Question } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { Control, Controller, FieldError, FieldErrors, UseFormWatch } from 'react-hook-form'
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
  control: Control<FormValues>
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
  autoSave: UseAutoSaveReturn
}
const FieldComponent = ({
  fieldType,
  fieldName,
  question,
  control,
  error,
  isLoading,
  watch,
  formErrors,
  autoSave,
}: Props) => {
  const tValidation = useTranslations('form.validation')
  const tFormat = useTranslations('emissionFactors.post.cutQuestions.format')

  const isSavingOnBlur = useMemo(() => fieldType === FieldType.TEXT || fieldType === FieldType.NUMBER, [fieldType])

  const saveField = useCallback(
    (value: unknown) => {
      if (!formErrors[fieldName]) {
        autoSave.saveField(question, value as Prisma.InputJsonValue)
      }
    },
    [autoSave, question, formErrors, fieldName],
  )

  const handleBlur = useCallback(() => {
    const currentValue = watch(fieldName)
    saveField(currentValue)
  }, [watch, fieldName, saveField])

  const baseInputProps = useMemo(() => {
    const label = getQuestionLabel(question.type, tFormat)
    return {
      question,
      label,
      errorMessage: error?.message ? tValidation(error.message) : undefined,
      disabled: isLoading,
    }
  }, [question, tValidation, error?.message, isLoading, tFormat])

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
        default:
          console.warn(`Unsupported question type: ${question.type} (mapped to: ${fieldType})`)
          return TextUnitInput
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
        />
      )
    }

    const InputComponent = getInputComponent()

    return (
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const { ref, onBlur, ...fieldWithoutRef } = field

          const handleFieldBlur = () => {
            onBlur()
            if (isSavingOnBlur) {
              handleBlur()
            }
          }

          return (
            <InputComponent
              {...fieldWithoutRef}
              ref={ref}
              onBlur={handleFieldBlur}
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
