import { Prisma, Question } from '@prisma/client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FieldErrors, UseFormWatch } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, FieldErrors, UseFormWatch } from 'react-hook-form'
import { UseAutoSaveReturn } from '../../hooks/useAutoSave'
import FieldComponent from './FieldComponent'
import QuestionContainer from './QuestionContainer'
import { getQuestionFieldType } from './services/questionService'
import { DynamicFormFieldProps, FormValues } from './types/formTypes'

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
  const fieldName = question.idIntern
  const fieldStatus = autoSave.getFieldStatus(question.id)
  const fieldType = useMemo(() => getQuestionFieldType(question.type, question.unit), [question.type, question.unit])
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

  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name === fieldName) {
        const value = formValues[fieldName]

        if (!isSavingOnBlur) {
          saveField(value)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [watch, fieldName, saveField, isSavingOnBlur])

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
          const { ref, onBlur, ...fieldWithoutRef } = field

          const handleFieldBlur = () => {
            onBlur()
            if (isSavingOnBlur) {
              handleBlur()
            }
          }

          return (
            <FieldComponent
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
  }, [fieldType, fieldName, control, baseInputProps, question.type, handleBlur, isSavingOnBlur])

  return (
    <QuestionContainer question={question} isLoading={isLoading} saveStatus={fieldStatus}>
      <FieldComponent
        fieldType={fieldType}
        fieldName={fieldName}
        question={question}
        control={control}
        error={error}
        isLoading={isLoading}
      />
    </QuestionContainer>
  )
}

export default DynamicFormField
