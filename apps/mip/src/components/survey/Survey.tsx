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
  const [state, setState] = useState<FormState<string>>(() => initState())
  const [interstitialCategoryKey, setInterstitialCategoryKey] = useState<string | null>(null)
  const [isFinalInterstitial, setIsFinalInterstitial] = useState(false)
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

  const handleRestart = () => {
    clearSurveyState(surveyId)
    setIsResumed(false)
    setInterstitialCategoryKey(null)
    setIsFinalInterstitial(false)
    setState(initState())
  }

  const handleNext = () => {
    const newState = formBuilder.goToNextPage({ ...state, pages: [...state.pages] })
    const { elements: newElements } = formBuilder.currentPage(newState)
    const newGrouped = buildGroupedElements(engine, newElements)
    const newCategoryKey = getCategoryKey(newGrouped)

    if (categoryKey && newCategoryKey !== categoryKey) {
      setInterstitialCategoryKey(categoryKey)
      setIsFinalInterstitial(false)
      return
    }
    updateState(newState)
  }

  const handleCompleteButton = async () => {
    if (categoryKey) {
      setInterstitialCategoryKey(categoryKey)
      setIsFinalInterstitial(true)
      return
    }

    await completeSurvey()
  }

  const completeSurvey = async () => {
    if (isCompleting) {
      return
    }

    const completedState = formBuilder.goToNextPage(state)
    setIsCompleting(true)

    try {
      await createSurveyResponse(surveyId, JSON.stringify(completedState))
      updateState(completedState)
      router.replace(`/${surveyId}/results`)
    } catch (error) {
      console.error('Survey completion failed', { surveyId, error })
    } finally {
      setIsCompleting(false)
    }
  }

  const { elements } = formBuilder.currentPage(state)
  const { current, pageCount, hasNextPage, hasPreviousPage } = formBuilder.pagination(state)
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
                  isLastPage={isFinalInterstitial}
                  isCompleting={isFinalInterstitial ? isCompleting : false}
                  previousLabel={tCommon('previous')}
                  nextLabel={tCommon('next')}
                  completeLabel={t('navigation.complete')}
                  onPrevious={() => {
                    setInterstitialCategoryKey(null)
                    setIsFinalInterstitial(false)
                  }}
                  onNext={() => {
                    if (isFinalInterstitial) {
                      void completeSurvey()
                      return
                    }
                    setInterstitialCategoryKey(null)
                    updateState(formBuilder.goToNextPage(state))
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
                  isLastPage={!hasNextPage}
                  isCompleting={isCompleting}
                  backToExplanationLabel={t('navigation.backToExplanation')}
                  previousLabel={tCommon('previous')}
                  nextLabel={tCommon('next')}
                  completeLabel={t('navigation.complete')}
                  onBackToExplanation={() => setIsExplanationVisible(true)}
                  onPrevious={() => updateState(formBuilder.goToPreviousPage(state))}
                  onNext={handleNext}
                  onComplete={handleCompleteButton}
                />
              </>
            )}
          </div>
          <SurveyCategoriesSidebar
            activeCategoryKey={interstitialCategoryKey ?? categoryKey}
            situation={state.situation}
          />
        </div>
      </Container>
    </div>
  )
}
