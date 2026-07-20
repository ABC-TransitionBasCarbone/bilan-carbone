'use client'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { createResponseWithJson } from '@/services/serverFunctions/campaign'
import { buildPageBuilder } from '@abc-transitionbascarbone/publicodes/form'
import { Container, Typography } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './Survey.module.css'
import { buildGroupedElements, getCurrentSectionTitle } from './surveyGrouping'
import SurveyNavigation from './SurveyNavigation'
import SurveyProgressHeader from './SurveyProgressHeader'
import SurveyQuestionList from './SurveyQuestionList'
import SurveyResumeCard from './SurveyResumeCard'
import { clearSurveyState, loadSurveyState, saveSurveyState } from './surveyStateStorage'

interface MipSurveyProps {
  surveyId: string
  rootRule?: string
}

export default function Survey({ surveyId, rootRule = 'bilan' }: MipSurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { engine } = useMipPublicodes()
  const router = useRouter()

  const formBuilder = new FormBuilder({
    engine,
    pageBuilder: buildPageBuilder(engine),
  })

  function initState() {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, rootRule)
    return s
  }

  const [isResumed, setIsResumed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [state, setState] = useState<FormState<string>>(initState)
  const updateState = (newState: FormState<string>) => setState(newState)

  useEffect(() => {
    const saved = loadSurveyState<FormState<string>>(surveyId)
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(saved)
      setIsResumed(true)
    }
    setIsLoading(false)
  }, [surveyId])

  useEffect(() => {
    if (!isLoading) {
      saveSurveyState(surveyId, state)
    }
  }, [surveyId, state, isLoading])

  useEffect(() => {
    if (!isLoading && !isResumed && !isCompleting) {
      const { current, pageCount, hasNextPage } = formBuilder.pagination(state)
      const isComplete = !hasNextPage && current === pageCount
      if (isComplete) {
        router.replace(`/${surveyId}/results`)
      }
    }
  }, [formBuilder, isCompleting, isLoading, isResumed, router, state, surveyId])

  const handleRestart = () => {
    clearSurveyState(surveyId)
    setIsResumed(false)
    setState(initState())
  }

  const completeSurvey = async () => {
    if (isCompleting) {
      return
    }

    setIsCompleting(true)
    const completedState = formBuilder.goToNextPage(state)

    try {
      await createResponseWithJson(surveyId, JSON.stringify(completedState))
      saveSurveyState(surveyId, completedState)
      router.push(`/${surveyId}/results`)
    } finally {
      setIsCompleting(false)
    }
  }

  const { elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)
  const isComplete = !hasNextPage && current === pageCount
  const progress = Math.round((current / pageCount) * 100)
  const groupedElements = buildGroupedElements(engine, elements)
  const currentTitle = getCurrentSectionTitle(engine, groupedElements)

  if (isLoading) {
    return <Typography>{t('loading')}</Typography>
  }

  if (isResumed) {
    return (
      <SurveyResumeCard
        title={t('resume')}
        restartLabel={t('navigation.restart')}
        continueLabel={t('navigation.continue')}
        onRestart={handleRestart}
        onContinue={() => setIsResumed(false)}
      />
    )
  }

  if (isComplete) {
    return null
  }

  return (
    <Container maxWidth="md" className={styles.container}>
      <SurveyProgressHeader
        title={currentTitle.label}
        icons={currentTitle.icons}
        progress={progress}
        questionLabel={t('progress.question', {
          current: Math.min(current, pageCount),
          total: pageCount,
        })}
        completionLabel={t('progress.complete', { percent: progress })}
      />

      <SurveyQuestionList
        groupedElements={groupedElements}
        engine={engine}
        state={state}
        formBuilder={formBuilder}
        updateState={updateState}
      />

      <SurveyNavigation
        hasPreviousPage={hasPreviousPage}
        isLastPage={pageCount === current + 1}
        isSubmittingCompletion={isCompleting}
        previousLabel={tCommon('previous')}
        nextLabel={tCommon('next')}
        completeLabel={t('navigation.complete')}
        onPrevious={() => updateState(formBuilder.goToPreviousPage(state))}
        onNext={() => updateState(formBuilder.goToNextPage(state))}
        onComplete={() => {
          void completeSurvey()
        }}
      />
    </Container>
  )
}
