import { UseAutoSaveReturn } from '@/hooks/useAutoSave'
import { getQuestionLabel } from '@/utils/question'
import type { Question } from '@repo/db-common'
import { useTranslations } from 'next-intl'
import { Control, FieldError, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import FieldComponent from './FieldComponent'
import TableInput from './inputFields/TableInput'
import { FormValues } from './types/formTypes'
import { FieldType } from './types/questionTypes'

interface Props {
  fieldType: FieldType
  fieldName: string
  question: Question
  error?: FieldError
  isLoading?: boolean
  disabled?: boolean
  control: Control<FormValues>
  watch: UseFormWatch<FormValues>
  formErrors: FieldErrors<FormValues>
  autoSave: UseAutoSaveReturn
  setValue: UseFormSetValue<FormValues>
  studyStartDate: Date
}

const FieldWrapper = ({
  fieldType,
  fieldName,
  question,
  control,
  error,
  isLoading,
  disabled,
  watch,
  formErrors,
  autoSave,
  setValue,
  studyStartDate,
}: Props) => {
  const tValidation = useTranslations('form.validation')
  const tFormat = useTranslations('emissionFactors.post.questions.format')

  const label = getQuestionLabel(question.type, tFormat)
  const errorMessage = error?.message ? tValidation(error.message) : undefined
  const isDisabled = isLoading || disabled

  if (fieldType === FieldType.TABLE) {
    return (
      <TableInput
        question={question}
        label={label}
        errorMessage={errorMessage}
        disabled={isDisabled}
        control={control}
        autoSave={autoSave}
        watch={watch}
        formErrors={formErrors}
        setValue={setValue}
        studyStartDate={studyStartDate}
      />
    )
  }

  return (
    <FieldComponent
      fieldType={fieldType}
      fieldName={fieldName}
      question={question}
      control={control}
      error={error}
      isLoading={isLoading}
      disabled={disabled}
      watch={watch}
      formErrors={formErrors}
      autoSave={autoSave}
      setValue={setValue}
    />
  )
}

export default FieldWrapper
