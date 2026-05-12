'use client'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { InputField, QuestionContainer } from '@abc-transitionbascarbone/publicodes/form'
import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button, Card, CardContent, Container, LinearProgress, Typography } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import styles from './Survey.module.css'

function getStorageKey(surveyId: string) {
  return `mip-publicodes-state-${surveyId}`
}

function saveState(surveyId: string, state: FormState<string>) {
  localStorage.setItem(getStorageKey(surveyId), JSON.stringify(state))
}

function loadState(surveyId: string): FormState<string> | null {
  try {
    const raw = localStorage.getItem(getStorageKey(surveyId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface MipSurveyProps {
  surveyId: string
  rootRule?: string
}

export default function Survey({ surveyId, rootRule = 'bilan' }: MipSurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { engine } = useMipPublicodes()
  const formBuilder = useMemo(
    () =>
      new FormBuilder({
        engine,
        pageBuilder: (fields) => fields.map((field) => ({ elements: [field] })),
      }),
    [engine],
  )

  const initState = useCallback(() => {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, rootRule)
    return s
  }, [formBuilder, rootRule])

  const [isResumed, setIsResumed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [state, setState] = useState<FormState<string>>(initState)

  useEffect(() => {
    const saved = loadState(surveyId)
    if (saved) {
      setState(saved)
      setIsResumed(true)
    }
    setIsLoading(false)
  }, [surveyId])

  useEffect(() => {
    saveState(surveyId, state)
  }, [surveyId, state])

  const updateState = useCallback((newState: FormState<string>) => {
    setState(newState)
  }, [])

  const handleRestart = () => {
    localStorage.removeItem(getStorageKey(surveyId))
    setIsResumed(false)
    setState(initState())
  }

  const { title, elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)
  const isComplete = !hasNextPage && current === pageCount

  const progress = useMemo(() => Math.round((current / pageCount) * 100), [current, pageCount])

  if (isLoading) {
    return <Typography>{t('loading')}</Typography>
  }

  if (isResumed) {
    return (
      <Container maxWidth="md">
        <Typography variant="h4">{t('resume')}</Typography>
        <div>
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
            </div>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <div>
        <Typography variant="h3">{title}</Typography>
        <div className={styles.progress}>
          <div className={styles.progressLabels}>
            <Typography variant="body2" color="text.secondary">
              {t('progress.question', {
                current: Math.min(current, pageCount),
                total: pageCount,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('progress.complete', { percent: progress })}
            </Typography>
          </div>
          <LinearProgress variant="determinate" value={progress} />
        </div>
      </div>

      {elements.map((el) => (
        <QuestionContainer key={el.id} label={el.label ?? el.id}>
          <InputField
            formElement={el}
            onChange={(ruleName, value) => updateState(formBuilder.handleInputChange(state, ruleName, value))}
          />
        </QuestionContainer>
      ))}

      <div>
        {hasPreviousPage && (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => updateState(formBuilder.goToPreviousPage(state))}
          >
            {tCommon('previous')}
          </Button>
        )}
        {hasNextPage ? (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => updateState(formBuilder.goToNextPage(state))}
          >
            {tCommon('next')}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            endIcon={<Check />}
            onClick={() => updateState(formBuilder.goToNextPage(state))}
          >
            {t('navigation.complete')}
          </Button>
        )}
      </div>
    </Container>
  )
}
