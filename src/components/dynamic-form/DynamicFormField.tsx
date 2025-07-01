import { Prisma, Question } from '@prisma/client'
import { useCallback, useEffect, useMemo } from 'react'
import { FieldErrors, UseFormWatch } from 'react-hook-form'
import { UseAutoSaveReturn } from '../../hooks/useAutoSave'
import FieldComponent from './FieldComponent'
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

  return (
    <QuestionContainer question={question} isLoading={isLoading} saveStatus={fieldStatus}>
      <FieldComponent
        fieldType={fieldType}
        fieldName={fieldName}
        question={question}
        control={control}
        error={error}
        isLoading={isLoading}
        watch={watch}
        formErrors={formErrors}
        autoSave={autoSave}
      />
    </QuestionContainer>
  )
}

export default DynamicFormField
