import { Prisma, Question } from '@prisma/client'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FieldErrors, UseFormWatch } from 'react-hook-form'
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
