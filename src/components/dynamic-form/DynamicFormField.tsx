import { useEffect } from 'react'
import { Controller, UseFormWatch } from 'react-hook-form'
import BooleanInputRHF from '../questions/BooleanInputRHF'
import SelectInputRHF from '../questions/SelectInputRHF'
import TextUnitInputRHF from '../questions/TextUnitInputRHF'
import TimePickerInputRHF from '../questions/TimePickerInputRHF'
import QuestionContainer from './QuestionContainer'
import { UseAutoSaveReturn } from './hooks/useAutoSave'
import { DynamicFormFieldProps, FormValues } from './types/formTypes'
import { QuestionType } from './types/questionTypes'

interface DynamicFormFieldPropsWithAutoSave extends DynamicFormFieldProps {
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
  const fieldStatus = autoSave.getFieldStatus(fieldName)

  // Watch for field changes and trigger auto-save
  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      if (name === fieldName) {
        const value = formValues[fieldName]
        autoSave.saveField(fieldName, value)
      }
    })

    return () => subscription.unsubscribe()
  }, [watch, fieldName, autoSave])

  const renderField = () => {
    switch (question.type) {
      case QuestionType.TEXT:
      case QuestionType.NUMBER:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TextUnitInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      case QuestionType.TIME:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <TimePickerInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      case QuestionType.SELECT:
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field }) => (
              <SelectInputRHF {...field} question={question} error={error?.message} disabled={isLoading} />
            )}
          />
        )

      case QuestionType.BOOLEAN:
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
        console.warn(`Unsupported question type: ${question.type}`)
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
