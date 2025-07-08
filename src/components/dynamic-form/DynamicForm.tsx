import { Alert, Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { FieldError } from 'react-hook-form'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useDynamicForm } from '../../hooks/useDynamicForm'
import DynamicFormField from './DynamicFormField'
import { DynamicFormProps } from './types/formTypes'

const DynamicForm = ({ questions, studyId, initialAnswers, isLoading = false, studySiteId }: DynamicFormProps) => {
  const tQuestions = useTranslations('emissionFactors.post.cutQuestions')

  const {
    control,
    formState: { errors, touchedFields },
    watch,
    setValue,
  } = useDynamicForm(questions, initialAnswers)

  const autoSave = useAutoSave(studyId, studySiteId)

  useEffect(() => {
    if (initialAnswers && initialAnswers.length > 0) {
      initialAnswers.forEach((answer) => {
        if (answer.response) {
          autoSave.initializeFieldStatus(answer.questionId, 'saved')
        }
      })
    }
    // Not adding autoSave to the dependency array prevents infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAnswers])

  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.order - b.order), [questions])

  const isFormDisabled = isLoading

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
            error={touchedFields[question.idIntern] ? (errors[question.idIntern] as FieldError | undefined) : undefined}
            isLoading={isFormDisabled}
            autoSave={autoSave}
            watch={watch}
            formErrors={errors}
            setValue={setValue}
          />
        ))}
      </Box>
    </Box>
  )
}

export default DynamicForm
