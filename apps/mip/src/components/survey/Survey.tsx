'use client'

import { useEffect, useMemo } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Typography,
  Alert,
} from '@mui/material'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import { SurveyEngine, Survey as SurveyType } from '@repo/survey'
import { useSurveyStore } from '@/store/surveyStore'
import { QuestionRenderer } from './QuestionRenderer'

interface SurveyProps {
  survey: SurveyType
  responseId?: string
}

export function Survey({ survey, responseId }: SurveyProps) {
  const t = useTranslations('survey')
  const {
    survey: loadedSurvey,
    response,
    currentQuestionIndex,
    error,
    loadSurvey,
    setAnswer,
    goToNext,
    goToPrevious,
  } = useSurveyStore()

  useEffect(() => {
    loadSurvey(survey, responseId)
  }, [survey, responseId, loadSurvey])

  const engine = useMemo(() => {
    if (!loadedSurvey || !response) return null
    return new SurveyEngine(loadedSurvey, response)
  }, [loadedSurvey, response])

  if (!engine || !response) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>{t('loading')}</Typography>
      </Container>
    )
  }

  const currentQuestion = engine.getCurrentQuestion()
  const progress = engine.getProgress()
  const isComplete = engine.isComplete()

  if (isComplete) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Check sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {t('completed.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t('completed.description')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('completed.responseId', { id: response.responseId })}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    )
  }

  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{t('notFound')}</Alert>
      </Container>
    )
  }

  const currentAnswer = engine.getAnswer(currentQuestion.id)

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={3}>
        <Typography variant="h3" gutterBottom>
          {survey.title}
        </Typography>
        {survey.description && (
          <Typography variant="body1" color="text.secondary">
            {survey.description}
          </Typography>
        )}
      </Box>

      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            {t('progress.question', {
              current: Math.min(currentQuestionIndex + 1, survey.questions.length),
              total: survey.questions.length,
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('progress.complete', { percent: progress })}
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => setAnswer(currentQuestion.id, value)}
            error={error}
          />
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between">
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={goToPrevious}
          disabled={!engine.hasPreviousQuestion()}
        >
          {t('navigation.previous')}
        </Button>

        {engine.hasNextQuestion() ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={goToNext}
          >
            {t('navigation.next')}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            endIcon={<Check />}
            onClick={goToNext}
          >
            {t('navigation.complete')}
          </Button>
        )}
      </Box>

      <Box mt={4} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          {t('completed.responseId', { id: response.responseId })}
        </Typography>
      </Box>
    </Container>
  )
}
