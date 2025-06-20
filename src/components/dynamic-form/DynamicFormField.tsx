import { Question } from '@prisma/client'
import { useEffect } from 'react'
import { Controller, UseFormWatch } from 'react-hook-form'
import BooleanInputRHF from '../questions/BooleanInputRHF'
import SelectInputRHF from '../questions/SelectInputRHF'
import TextUnitInputRHF from '../questions/TextUnitInputRHF'
import TimePickerInputRHF from '../questions/TimePickerInputRHF'
import QuestionContainer from './QuestionContainer'
import { UseAutoSaveReturn } from './hooks/useAutoSave'
import { getQuestionFieldType } from './services/questionService'
import { DynamicFormFieldProps, FormValues } from './types/formTypes'
import { FieldType } from './types/questionTypes'

interface DynamicFormFieldPropsWithAutoSave extends Omit<DynamicFormFieldProps, 'question'> {
  question: Question
  autoSave: UseAutoSaveReturn
  watch: UseFormWatch<FormValues>
}

const DynamicFormField = ({
  question,
  control,
  error,
  isLoading,
  autoSave,
  watch,
}: DynamicFormFieldPropsWithAutoSave) => {
  const fieldName = question.idIntern
  const fieldStatus = autoSave.getFieldStatus(question.id)

  // Watch for field changes and trigger auto-save
  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name === fieldName) {
        const value = formValues[fieldName]
        autoSave.saveField(question.id, value)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, fieldName, autoSave, question.id])

  const renderField = () => {
    const internalType = getQuestionFieldType(question.type)

    switch (internalType) {
      case FieldType.TEXT:
      case FieldType.NUMBER:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextUnitInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      case FieldType.TIME:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TimePickerInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      case FieldType.SELECT:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <SelectInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      case FieldType.BOOLEAN:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <BooleanInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      default:
        console.warn(`Unsupported question type: ${question.type} (mapped to: ${internalType})`)
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextUnitInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )
    }
  }

  return (
    <QuestionContainer question={question} isLoading={isLoading} saveStatus={fieldStatus}>
      {renderField()}
    </QuestionContainer>
  )
}

export default DynamicFormField
