'use client'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { createSurveyResponse } from '@/services/serverFunctions/survey'
import { buildPageBuilder } from '@abc-transitionbascarbone/publicodes/form'
import { Container, Typography } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import styles from './Survey.module.css'
import SurveyCategoriesSidebar from './SurveyCategoriesSidebar'
import SurveyCategoryInterstitial from './SurveyCategoryInterstitial'
import SurveyExplanation from './SurveyExplanation'
import { buildGroupedElements, getCategoryKey, getCurrentSectionTitle } from './surveyGrouping'
import SurveyNavigation from './SurveyNavigation'
import SurveyProgressHeader from './SurveyProgressHeader'
import SurveyQuestionList from './SurveyQuestionList'
import SurveyResumeCard from './SurveyResumeCard'
import {
  clearSurveyState,
  loadSurveyState,
  loadSurveySubmissionStatus,
  saveSurveyState,
  saveSurveySubmissionStatus,
} from './surveyStateStorage'

interface MipSurveyProps {
  surveyId: string
  rootRule?: string
}

export default function Survey({ surveyId, rootRule = 'bilan' }: MipSurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { engine } = useMipPublicodes()
  const router = useRouter()

  const formBuilder = useMemo(
    () =>
      new FormBuilder({
        engine,
        pageBuilder: buildPageBuilder(engine),
      }),
    [engine],
  )

  const initState = () => formBuilder.start(FormBuilder.newState(), rootRule)

  const [isResumed, setIsResumed] = useState(false)
  const [isExplanationVisible, setIsExplanationVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [state, setState] = useState<FormState<string>>(() => initState())
  const [interstitialCategoryKey, setInterstitialCategoryKey] = useState<string | null>(null)
  const [pendingNextState, setPendingNextState] = useState<FormState<string> | null>(null)
  const updateState = (newState: FormState<string>) => setState(newState)

  useEffect(() => {
    const saved = loadSurveyState<FormState<string>>(surveyId)
    const wasSubmitted = loadSurveySubmissionStatus(surveyId)
    if (saved) {
      const startedState = formBuilder.start(
        {
          ...FormBuilder.newState<string>(),
          situation: saved.situation,
        },
        rootRule,
      )
      const { pageCount } = formBuilder.pagination(startedState)
      const targetPageIndex = Math.max(0, Math.min(saved.currentPageIndex ?? 0, pageCount - 1))

      let rebuiltState = startedState
      for (let index = 0; index < targetPageIndex; index++) {
        rebuiltState = formBuilder.goToNextPage({
          ...rebuiltState,
          pages: [...rebuiltState.pages],
          nextPages: [...rebuiltState.nextPages],
        })
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(rebuiltState)
      setIsResumed(true)
    }
    setIsSubmitted(wasSubmitted)
    setIsLoading(false)
  }, [formBuilder, rootRule, surveyId])

  useEffect(() => {
    if (!isLoading) {
      saveSurveyState(surveyId, state)
      saveSurveySubmissionStatus(surveyId, isSubmitted)
    }
  }, [surveyId, state, isLoading, isSubmitted])

  useEffect(() => {
    if (isSubmitted) {
      router.replace(`/${surveyId}/results`)
    }
  }, [isSubmitted, router, surveyId])

  const handleRestart = () => {
    clearSurveyState(surveyId)
    setIsResumed(false)
    setInterstitialCategoryKey(null)
    setPendingNextState(null)
    setState(initState())
  }

  const handleNext = () => {
    const newState = formBuilder.goToNextPage({ ...state, pages: [...state.pages] })
    const { elements: newElements } = formBuilder.currentPage(newState)
    const newGrouped = buildGroupedElements(engine, newElements)
    const newCategoryKey = getCategoryKey(newGrouped)

    if (categoryKey && newCategoryKey !== categoryKey) {
      setInterstitialCategoryKey(categoryKey)
      setPendingNextState(newState)
      return
    }
    setPendingNextState(null)
    updateState(newState)
  }

  const completeSurvey = async () => {
    if (isCompleting) {
      return
    }

    const completedState = formBuilder.goToNextPage({
      ...state,
      pages: [...state.pages],
      nextPages: [...state.nextPages],
    })
    setIsCompleting(true)

    try {
      await createSurveyResponse(surveyId, JSON.stringify(completedState))
      updateState(completedState)
      setIsSubmitted(true)
      saveSurveySubmissionStatus(surveyId, true)
    } catch (error) {
      console.error('Survey completion failed', { surveyId, error })
    } finally {
      setIsCompleting(false)
    }
  }

  const { elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)
  const isLastPage = !hasNextPage && current === pageCount
  const progress = Math.round((current / pageCount) * 100)
  const groupedElements = buildGroupedElements(engine, elements)
  const currentTitle = getCurrentSectionTitle(engine, groupedElements)
  const categoryKey = getCategoryKey(groupedElements)

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

  if (isExplanationVisible) {
    return <SurveyExplanation onStart={() => setIsExplanationVisible(false)} />
  }

  return (
    <div className={styles.scrollWrapper}>
      <Container maxWidth="lg" className="pt1 pb5">
        <div className={classNames(styles.surveyLayout, 'align-start', 'gapped2')}>
          <div className={classNames(styles.surveyMain, 'grow')}>
            {interstitialCategoryKey ? (
              <>
                <SurveyCategoryInterstitial categoryKey={interstitialCategoryKey} />
                <SurveyNavigation
                  hasPreviousPage={true}
                  isLastPage={false}
                  isCompleting={false}
                  previousLabel={tCommon('previous')}
                  nextLabel={tCommon('next')}
                  completeLabel={t('navigation.complete')}
                  onPrevious={() => {
                    setInterstitialCategoryKey(null)
                    setPendingNextState(null)
                  }}
                  onNext={() => {
                    setInterstitialCategoryKey(null)
                    const nextState =
                      pendingNextState ?? formBuilder.goToNextPage({ ...state, pages: [...state.pages] })
                    setPendingNextState(null)
                    updateState(nextState)
                  }}
                  onComplete={completeSurvey}
                />
              </>
            ) : (
              <>
                <SurveyProgressHeader
                  title={currentTitle.label}
                  icons={currentTitle.icons}
                  progress={progress}
                  categoryKey={categoryKey}
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
                  canGoBackToExplanation={!hasPreviousPage}
                  isLastPage={isLastPage}
                  isCompleting={isCompleting}
                  backToExplanationLabel={t('navigation.backToExplanation')}
                  previousLabel={tCommon('previous')}
                  nextLabel={tCommon('next')}
                  completeLabel={t('navigation.complete')}
                  onBackToExplanation={() => setIsExplanationVisible(true)}
                  onPrevious={() => updateState(formBuilder.goToPreviousPage(state))}
                  onNext={handleNext}
                  onComplete={completeSurvey}
                />
              </>
            )}
          </div>
          <SurveyCategoriesSidebar activeCategoryKey={interstitialCategoryKey ?? categoryKey} />
        </div>
      </Container>
    </div>
  )
}
