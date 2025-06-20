import { Alert, Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { FieldError } from 'react-hook-form'
import DynamicFormField from './DynamicFormField'
import { useAutoSave } from './hooks/useAutoSave'
import { useDynamicForm } from './hooks/useDynamicForm'
import { DynamicFormProps } from './types/formTypes'

const DynamicForm = ({ questions, studyId, initialAnswers, isLoading = false }: DynamicFormProps) => {
  const tQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const {
    control,
    formState: { errors },
    watch,
  } = useDynamicForm(questions, initialAnswers)

  const autoSave = useAutoSave(studyId)

  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.order - b.order), [questions])

  const isFormDisabled = isLoading

  // Check if any fields have save errors
  const hasAutoSaveErrors = useMemo(() => {
    return sortedQuestions.some((q) => autoSave.getFieldStatus(q.idIntern).status === 'error')
  }, [sortedQuestions, autoSave])

  return (
    <Box className="dynamic-form">
      {hasAutoSaveErrors && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">{tQuestions('autoSaveError')}</Typography>
        </Alert>
      )}

      <Box>
        {sortedQuestions.map((question) => (
          <DynamicFormField
            key={question.id}
            question={question}
            control={control}
            error={errors[question.idIntern] as FieldError | undefined}
            isLoading={isFormDisabled}
            autoSave={autoSave}
            watch={watch}
          />
        ))}
      </Box>
    </Box>
  )
}

export default DynamicForm
