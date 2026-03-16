import { emissionFactorMap } from '@/constants/emissionFactorMap'
import { areQuestionsLinked } from '@/utils/question'
import { Alert, Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo } from 'react'
import { FieldError } from 'react-hook-form'
import { useAutoSave } from '../../hooks/useAutoSave'
import { useBeforeUnload } from '../../hooks/useBeforeUnload'
import { useConditionalVisibility } from '../../hooks/useConditionalVisibility'
import { useDynamicForm } from '../../hooks/useDynamicForm'
import styles from './DynamicForm.module.css'
import DynamicFormField from './DynamicFormField'
import { DynamicFormProps } from './types/formTypes'

const DynamicForm = ({
  questions,
  studyId,
  initialAnswers,
  isLoading = false,
  studySiteId,
  studyStartDate,
}: DynamicFormProps) => {
  const tQuestions = useTranslations('emissionFactors.post.questions')

  const {
    form: {
      control,
      formState: { errors, touchedFields },
      watch,
      setValue,
    },
    updateDefaultValues,
  } = useDynamicForm(questions, initialAnswers)

  const autoSave = useAutoSave(studyId, studySiteId)

  useEffect(() => {
    if (initialAnswers) {
      initialAnswers.forEach((answer) => {
        if (answer.response) {
          autoSave.initializeFieldStatus(answer.questionId, 'saved')
          // Set the initial value to compare against future changes
          autoSave.setInitialValue(answer.questionId, answer.response)
        }
      })
      updateDefaultValues(initialAnswers)
    }
    // Not adding autoSave to the dependency array prevents infinite re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAnswers])

  const sortedQuestions = useMemo(() => [...questions].sort((a, b) => a.order - b.order), [questions])

  const visibleQuestions = useConditionalVisibility(sortedQuestions, watch, studySiteId, setValue)

  const isFormDisabled = isLoading

  const hasAutoSaveErrors = useMemo(() => {
    return visibleQuestions.some((q) => autoSave.getFieldStatus(q.idIntern).status === 'error')
  }, [visibleQuestions, autoSave])

  // Use native browser beforeunload warning for unsaved changes
  useBeforeUnload({
    when: autoSave.hasUnsavedChanges(),
  })

  return (
    <Box className="dynamic-form">
      {hasAutoSaveErrors && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">{tQuestions('autoSaveError')}</Typography>
        </Alert>
      )}

      <Box>
        {visibleQuestions.map((question, index) => {
          const previousQuestion = index > 0 ? visibleQuestions[index - 1] : null
          const currentQuestionInfo = emissionFactorMap[question.idIntern]
          const previousQuestionInfo = previousQuestion ? emissionFactorMap[previousQuestion.idIntern] : null
          const showRelationLine =
            previousQuestion && areQuestionsLinked(currentQuestionInfo, previousQuestion, previousQuestionInfo)

          return (
            <Box key={question.id}>
              {showRelationLine && <Box className={styles.relationLine} />}
              <DynamicFormField
                question={question}
                control={control}
                error={
                  touchedFields[question.idIntern] ? (errors[question.idIntern] as FieldError | undefined) : undefined
                }
                isLoading={isFormDisabled}
                autoSave={autoSave}
                watch={watch}
                formErrors={errors}
                setValue={setValue}
                studyStartDate={studyStartDate}
              />
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default DynamicForm
