import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { getAnswerByQuestionIdAndStudySiteId } from '@/services/serverFunctions/question'
import { getQuestionLabel } from '@/utils/question'
import { Prisma, Question } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'
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
    async (value: unknown) => {
      if (!formErrors[fieldName]) {
        let finalValue = value
        if (ID_INTERN_PREFIX_REGEX.test(fieldName)) {
          const key = fieldName.split('-').pop()
          if (key) {
            const tableValue = { [key]: value }
            const response = await getAnswerByQuestionIdAndStudySiteId(question.id, autoSave.studySiteId)
            if (response.success) {
              const { data } = response
              if (data) {
                const updatedValue = { ...(data.response as JsonObject), ...tableValue }
                finalValue = updatedValue
              } else {
                finalValue = tableValue
              }
            }
          }
        }
        autoSave.saveField(question, finalValue as Prisma.InputJsonValue)
      }
    },
    [formErrors, fieldName, autoSave, question],
  )

  const handleBlur = useCallback(() => {
    const currentValue = watch(fieldName)
    console.debug({ currentValue })
    saveField(currentValue)
  }, [watch, fieldName, saveField])

  const handleChange = useCallback(
    (value: string | null) => {
      saveField(value)
    },
    [saveField],
  )

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
          autoSave={autoSave}
          watch={watch}
          formErrors={formErrors}
        />
      )
    }

    const InputComponent = getInputComponent()

    return (
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const { ref, onBlur, onChange, ...fieldWithoutRef } = field
          const handleFieldBlur = () => {
            onBlur()
            if (isSavingOnBlur) {
              handleBlur()
            }
          }

          const handleFieldChange = (value: string | null) => {
            onChange(value)
            if (!isSavingOnBlur) {
              handleChange(value)
            }
          }

          return (
            <InputComponent
              {...fieldWithoutRef}
              ref={ref}
              onBlur={handleFieldBlur}
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
