'use client'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { createSurveyResponse } from '@/services/serverFunctions/survey'
import { buildPageBuilder } from '@abc-transitionbascarbone/publicodes/form'
import { Container, Typography } from '@mui/material'
import { FormBuilder, FormState } from '@publicodes/forms'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

const partnerLogos = [
  {
    src: '/logos/partners/abc.png',
    alt: 'ABC',
  },
  {
    src: '/logos/partners/grdf.png',
    alt: 'GRDF',
  },
  {
    src: '/logos/partners/ag2r-la-mondiale.png',
    alt: 'AG2R La Mondiale',
  },
  {
    src: '/logos/partners/edf.png',
    alt: 'EDF',
  },
  {
    src: '/logos/partners/france-travail.png',
    alt: 'France Travail',
  },
]

export default function Survey({ surveyId, rootRule = 'bilan' }: MipSurveyProps) {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { engine } = useMipPublicodes()
  const router = useRouter()

  const formBuilder = new FormBuilder({
    engine,
    pageBuilder: buildPageBuilder(engine),
  })

  const initState = () => {
    let s = FormBuilder.newState()
    s = formBuilder.start(s, rootRule)
    return s
  }

  const [isResumed, setIsResumed] = useState(false)
  const [isExplanationVisible, setIsExplanationVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [state, setState] = useState<FormState<string>>(initState)
  const [interstitialCategoryKey, setInterstitialCategoryKey] = useState<string | null>(null)
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
    if (!isLoading && !isResumed) {
      const { current, pageCount, hasNextPage } = formBuilder.pagination(state)
      const isComplete = !hasNextPage && current === pageCount
      if (isComplete) {
        router.replace(`/${surveyId}/results`)
      }
    }
  }, [formBuilder, isLoading, isResumed, router, state, surveyId])

  const handleRestart = () => {
    clearSurveyState(surveyId)
    setIsResumed(false)
    setInterstitialCategoryKey(null)
    setState(initState())
  }

  const handleNext = () => {
    const newState = formBuilder.goToNextPage(state)
    const { elements: newElements } = formBuilder.currentPage(newState)
    const newGrouped = buildGroupedElements(engine, newElements)
    const newCategoryKey = getCategoryKey(newGrouped)

    updateState(newState)

    if (interstitialCategoryKey && newCategoryKey && newCategoryKey !== interstitialCategoryKey) {
      setInterstitialCategoryKey(newCategoryKey)
    }
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
    } catch (error) {
      console.error('Survey completion failed', { surveyId, error })
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
    return <SurveyExplanation partnerLogos={partnerLogos} onStart={() => setIsExplanationVisible(false)} />
  }

  if (isComplete) {
    return null
  }

  return (
    <Container maxWidth="lg" className="pt1 pb5">
      <div className={styles.surveyLayout}>
        <div className={styles.surveyMain}>
          {interstitialCategoryKey ? (
            <>
              <SurveyCategoryInterstitial />
              <SurveyNavigation
                hasPreviousPage={true}
                isLastPage={false}
                isCompleting={false}
                previousLabel={tCommon('previous')}
                nextLabel={tCommon('next')}
                completeLabel={t('navigation.complete')}
                onPrevious={() => setInterstitialCategoryKey(null)}
                onNext={() => setInterstitialCategoryKey(null)}
                onComplete={completeSurvey}
              />
            </>
          ) : (
            <>
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
                canGoBackToExplanation={!hasPreviousPage}
                isLastPage={pageCount === current + 1}
                isCompleting={isCompleting}
                backToExplanationLabel={t('navigation.backToExplanation')}
                previousLabel={tCommon('previous')}
                nextLabel={tCommon('next')}
                completeLabel={t('navigation.complete')}
                onBackToExplanation={() => setIsExplanationVisible(true)}
                onPrevious={() => updateState(formBuilder.goToPreviousPage(state))}
                onNext={() => updateState(formBuilder.goToNextPage(state))}
                onComplete={completeSurvey}
              />
            </>
          )}
        </div>
        <SurveyCategoriesSidebar activeCategoryKey={interstitialCategoryKey ?? categoryKey} />
      </div>
    </Container>
  )
}
