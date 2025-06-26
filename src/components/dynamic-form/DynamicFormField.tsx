import { getQuestionLabel } from '@/utils/question'
import { Prisma, Question } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Controller, FieldErrors, UseFormWatch } from 'react-hook-form'
import { UseAutoSaveReturn } from '../../hooks/useAutoSave'
import DatePickerInput from './inputFields/DatePickerInput'
import QCMInput from './inputFields/QCMInput'
import QCUInput from './inputFields/QCUInput'
import SelectInput from './inputFields/SelectInput'
import TextUnitInput from './inputFields/TextUnitInput'
import YearPickerInput from './inputFields/YearPickerInput'
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
  const tFormat = useTranslations('emissionFactors.post.cutQuestions.format')

  const fieldName = question.idIntern
  const fieldStatus = autoSave.getFieldStatus(question.id)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedSave = useCallback(
    (value: unknown) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        if (!formErrors[fieldName]) {
          autoSave.saveField(question.id, value as Prisma.InputJsonValue)
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
    const getFieldComponent = () => {
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
