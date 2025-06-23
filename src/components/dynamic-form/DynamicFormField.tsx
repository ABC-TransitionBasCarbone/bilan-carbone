import { Question } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, FieldErrors, UseFormWatch } from 'react-hook-form'
import { UseAutoSaveReturn } from '../../hooks/useAutoSave'
import DatePickerInputRHF from './inputFields/DatePickerInput'
import SelectInputRHF from './inputFields/SelectInput'
import TextUnitInputRHF from './inputFields/TextUnitInput'
import YearPickerInputRHF from './inputFields/YearPickerInput'
import QuestionContainer from './QuestionContainer'
import { getQuestionFieldType } from './services/questionService'
import { DynamicFormFieldProps, FormValues } from './types/formTypes'
import { FieldType } from './types/questionTypes'

interface DynamicFormFieldPropsWithAutoSave extends Omit<DynamicFormFieldProps, 'question'> {
  question: Question
  autoSave: UseAutoSaveReturn
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
}

const DynamicFormField = ({
  question,
  control,
  error,
  isLoading,
  autoSave,
  watch,
  formErrors,
}: DynamicFormFieldPropsWithAutoSave) => {
  const tValidation = useTranslations('form.validation')

  const fieldName = question.idIntern
  const fieldStatus = autoSave.getFieldStatus(question.id)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedSave = useCallback(
    (value: unknown) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        // Only save if there are no validation errors for this field
        if (!formErrors[fieldName]) {
          autoSave.saveField(question.id, value)
        }
      }, 800)
    },
    [autoSave, question.id, formErrors, fieldName],
  )

  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name === fieldName) {
        const value = formValues[fieldName]
        debouncedSave(value)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [watch, fieldName, debouncedSave])

  const fieldType = useMemo(() => getQuestionFieldType(question.type, question.unite), [question.type, question.unite])

  const baseInputProps = useMemo(
    () => ({
      question,
      label: question.label,
      errorMessage: error?.message ? tValidation(error.message) : undefined,
      disabled: isLoading,
    }),
    [question, tValidation, error?.message, isLoading],
  )

  const renderField = useMemo(() => {
    const getFieldComponent = () => {
      switch (fieldType) {
        case FieldType.TEXT:
        case FieldType.NUMBER:
          return TextUnitInputRHF
        case FieldType.DATE:
          return DatePickerInputRHF
        case FieldType.YEAR:
          return YearPickerInputRHF
        case FieldType.SELECT:
          return SelectInputRHF
        default:
          console.warn(`Unsupported question type: ${question.type} (mapped to: ${fieldType})`)
          return TextUnitInputRHF
      }
    }

    const FieldComponent = getFieldComponent()

    return (
      <Controller
        name={fieldName}
        control={control}
        render={({ field }) => {
          const { ref, ...fieldWithoutRef } = field

          return (
            <FieldComponent
              {...fieldWithoutRef}
              ref={ref}
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
  }, [fieldType, fieldName, control, baseInputProps, question.type])

  return (
    <QuestionContainer question={question} isLoading={isLoading} saveStatus={fieldStatus}>
      {renderField}
    </QuestionContainer>
  )
}

export default DynamicFormField
