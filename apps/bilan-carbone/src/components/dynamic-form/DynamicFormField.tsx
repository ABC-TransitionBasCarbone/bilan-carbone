import { Question } from '@prisma/client'
import { useMemo } from 'react'
import { FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
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
  setValue: UseFormSetValue<FormValues>
  studyStartDate: Date
}

const DynamicFormField = ({
  question,
  control,
  error,
  isLoading,
  autoSave,
  watch,
  formErrors,
  setValue,
  studyStartDate,
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
        watch={watch}
        formErrors={formErrors}
        autoSave={autoSave}
        setValue={setValue}
        studyStartDate={studyStartDate}
      />
    </QuestionContainer>
  )
}

export default DynamicFormField
