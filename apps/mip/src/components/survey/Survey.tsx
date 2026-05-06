'use client'

import { SurveyEngine } from '@/engine'
import { surveyStorage } from '@/storage'
import { QuestionRenderer } from '@abc-transitionbascarbone/components'
import { SurveyResponse, Survey as SurveyType } from '@abc-transitionbascarbone/typeguards'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Alert, Button, Card, CardContent, Container, LinearProgress, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import styles from './Survey.module.css'

interface SurveyProps {
  survey: SurveyType
  surveyId: string
}

function initResponse(survey: SurveyType): SurveyResponse {
  const now = new Date()
  return {
    surveyId: survey.id,
    responseId: uuidv4(),
    answers: {},
    currentQuestionIndex: 0,
    completed: false,
    startedAt: now,
    updatedAt: now,
  }
}

export function Survey({ survey, surveyId }: SurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const [response, setResponse] = useState<SurveyResponse>(() => initResponse(survey))
  const [error, setError] = useState<string | null>(null)
  const [isResumed, setIsResumed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (surveyId) {
      const existing = surveyStorage.loadResponse(surveyId)
      if (existing && existing.surveyId === survey.id) {
        setResponse(existing)
        setIsResumed(true)
      }
    }
    setIsLoading(false)
  }, [surveyId])

  const engine = useMemo(() => new SurveyEngine(survey, response), [survey, response])

  const saveAndUpdate = useCallback((updatedResponse: SurveyResponse) => {
    surveyStorage.saveResponse(updatedResponse.surveyId, updatedResponse)
    setResponse({ ...updatedResponse })
  }, [])

  const handleAnswer = useCallback(
    (answer: string | string[]) => {
      engine.setAnswer(answer)
      saveAndUpdate(engine.getResponse())
      setError(null)
    },
    [engine, saveAndUpdate],
  )

  const handleNext = useCallback(() => {
    const currentQuestion = engine.getCurrentQuestion()
    if (currentQuestion?.required) {
      const answer = engine.getAnswer(currentQuestion.id)
      const validationError = engine.validateAnswer(currentQuestion, answer || '')
      if (validationError) {
        setError(validationError)
        return
      }
    }
    if (engine.hasNextQuestion()) {
      engine.goToNextQuestion()
    } else {
      engine.complete()
    }
    saveAndUpdate(engine.getResponse())
    setError(null)
  }, [engine, saveAndUpdate])

  const handlePrevious = useCallback(() => {
    if (engine.hasPreviousQuestion()) {
      engine.goToPreviousQuestion()
      saveAndUpdate(engine.getResponse())
      setError(null)
    }
  }, [engine, saveAndUpdate])

  const handleRestart = () => {
    setResponse(initResponse(survey))
    setIsResumed(false)
    surveyStorage.deleteResponse(surveyId)
  }

  const currentQuestion = engine.getCurrentQuestion()
  const progress = engine.getProgress()

  if (isLoading) {
    return <Typography>{t('loading')}</Typography>
  }

  if (isResumed) {
    return (
      <Container maxWidth="md" className={styles.container}>
        <div className={styles.header}>
          <Typography variant="h3" gutterBottom>
            {survey.title}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t('resume')}
          </Typography>
        </div>
        <div className={styles.navigation}>
          <Button variant="outlined" onClick={handleRestart}>
            {t('navigation.restart')}
          </Button>
          <Button variant="contained" onClick={() => setIsResumed(false)}>
            {t('navigation.continue')}
          </Button>
        </div>
      </Container>
    )
  }

  if (engine.isComplete()) {
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
              current: Math.min(response.currentQuestionIndex + 1, survey.questions.length),
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
        <Alert severity="error" className={styles.alert} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className={styles.questionCard}>
        <CardContent>
          <QuestionRenderer question={currentQuestion} value={currentAnswer} onChange={handleAnswer} error={error} />
        </CardContent>
      </Card>

      <div className={styles.navigation}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handlePrevious}
          disabled={!engine.hasPreviousQuestion()}
        >
          {tCommon('previous')}
        </Button>

        {engine.hasNextQuestion() ? (
          <Button variant="contained" endIcon={<ArrowForward />} onClick={handleNext}>
            {tCommon('next')}
          </Button>
        ) : (
          <Button variant="contained" color="success" endIcon={<Check />} onClick={handleNext}>
            {t('navigation.complete')}
          </Button>
        )}
      </div>
    </Container>
  )
}
