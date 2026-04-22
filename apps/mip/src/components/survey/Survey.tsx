'use client'

import { useEffect, useMemo } from 'react'
import { Alert, Button, Card, CardContent, Container, LinearProgress, Typography } from '@mui/material'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { useTranslations } from 'next-intl'
import { SurveyEngine, Survey as SurveyType } from '@repo/survey'
import { useSurveyStore } from '@/store/surveyStore'
import { QuestionRenderer } from './QuestionRenderer'
import styles from './Survey.module.css'

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
      <Container maxWidth="md" className={styles.container}>
        <Typography>{t('loading')}</Typography>
      </Container>
    )
  }

  const currentQuestion = engine.getCurrentQuestion()
  const progress = engine.getProgress()
  const isComplete = engine.isComplete()

  if (isComplete) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Card>
          <CardContent>
            <div className={styles.completedContent}>
              <Check className={styles.checkIcon} />
              <Typography variant="h4" gutterBottom>
                {t('completed.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {t('completed.description')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('completed.responseId', { id: response.responseId })}
              </Typography>
            </div>
          </CardContent>
        </Card>
      </Container>
    )
  }

  if (!currentQuestion) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <Alert severity="error">{t('notFound')}</Alert>
      </Container>
    )
  }

  const currentAnswer = engine.getAnswer(currentQuestion.id)

  return (
    <Container maxWidth="md" className={styles.container}>
      <div className={styles.header}>
        <Typography variant="h3" gutterBottom>
          {survey.title}
        </Typography>
        {survey.description && (
          <Typography variant="body1" color="text.secondary">
            {survey.description}
          </Typography>
        )}
      </div>

      <div className={styles.progress}>
        <div className={styles.progressLabels}>
          <Typography variant="body2" color="text.secondary">
            {t('progress.question', {
              current: Math.min(currentQuestionIndex + 1, survey.questions.length),
              total: survey.questions.length,
            })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('progress.complete', { percent: progress })}
          </Typography>
        </div>
        <LinearProgress variant="determinate" value={progress} />
      </div>

      {error && (
        <Alert severity="error" className={styles.alert} onClose={() => {}}>
          {error}
        </Alert>
      )}

      <Card className={styles.questionCard}>
        <CardContent>
          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswer}
            onChange={(value) => setAnswer(currentQuestion.id, value)}
            error={error}
          />
        </CardContent>
      </Card>

      <div className={styles.navigation}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={goToPrevious} disabled={!engine.hasPreviousQuestion()}>
          {t('navigation.previous')}
        </Button>

        {engine.hasNextQuestion() ? (
          <Button variant="contained" endIcon={<ArrowForward />} onClick={goToNext}>
            {t('navigation.next')}
          </Button>
        ) : (
          <Button variant="contained" color="success" endIcon={<Check />} onClick={goToNext}>
            {t('navigation.complete')}
          </Button>
        )}
      </div>

      <div className={styles.footer}>
        <Typography variant="caption" color="text.secondary">
          {t('completed.responseId', { id: response.responseId })}
        </Typography>
      </div>
    </Container>
  )
}

