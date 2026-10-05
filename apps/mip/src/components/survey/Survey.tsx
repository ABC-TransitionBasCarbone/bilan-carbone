'use client'
import { useMipPublicodes } from '@/lib/publicodes/MipPublicodesProvider'
import { useMipForm } from '@/lib/publicodes/useMipForm'
import { useMipRule } from '@/lib/publicodes/useMipRule'
import { createSurveyResponse } from '@/services/serverFunctions/survey'
import { parseMipSimulationState, type MipSimulationState } from '@/utils/survey'
import { getRuleCategoryKey } from '@abc-transitionbascarbone/shared/publicodes/form/utils'
import { Container } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './Survey.module.css'
import SurveyCategoriesSidebar from './SurveyCategoriesSidebar'
import SurveyCategoryInterstitial from './SurveyCategoryInterstitial'
import SurveyExplanation from './SurveyExplanation'
import { buildGroupedElements, getCategoryKey, getCurrentSectionTitle } from './surveyGrouping'
import SurveyNavigation from './SurveyNavigation'
import SurveyProgressHeader from './SurveyProgressHeader'
import SurveyQuestionList from './SurveyQuestionList'
import SurveyResumeCard from './SurveyResumeCard'
import { loadSurveyState } from './surveyStateStorage'

const Survey = () => {
  const t = useTranslations('survey')
  const tCommon = useTranslations('common')
  const { surveyId, engine, meta, simulation, resetSimulation } = useMipPublicodes()
  const form = useMipForm()
  const rule = useMipRule(form.currentQuestion ?? '')
  const router = useRouter()

  const [isResumed, setIsResumed] = useState(() => {
    const savedState = loadSurveyState<unknown>(surveyId)
    if (!savedState) {
      return false
    }
    const parsedState = parseMipSimulationState(savedState)
    return parsedState.foldedSteps.length > 0 || Object.keys(parsedState.situation).length > 0
  })
  const [isExplanationVisible, setIsExplanationVisible] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [interstitialCategoryKey, setInterstitialCategoryKey] = useState<string | null>(null)
  const [isFinalInterstitial, setIsFinalInterstitial] = useState(false)
  const [interstitialDirection, setInterstitialDirection] = useState<'next' | 'previous'>('next')
  const openInterstitial = (key: string, isFinal: boolean, direction: 'next' | 'previous' = 'next') => {
    setInterstitialCategoryKey(key)
    setIsFinalInterstitial(isFinal)
    setInterstitialDirection(direction)
  }

  const handleRestart = () => {
    resetSimulation()
    setIsResumed(false)
    setInterstitialCategoryKey(null)
    setIsFinalInterstitial(false)
  }

  const handleNext = () => {
    if (!form.currentQuestion) {
      return
    }

    const nextQuestion = form.relevantQuestions[form.relevantQuestions.indexOf(form.currentQuestion) + 1]
    if (nextQuestion && form.currentCategory && getRuleCategoryKey(nextQuestion) !== form.currentCategory) {
      openInterstitial(form.currentCategory, false, 'next')
      return
    }

    form.goToNextQuestion()
  }

  const handlePrevious = () => {
    const previousQuestion = form.relevantQuestions[currentIndex - 1]
    if (previousQuestion && form.currentCategory && getRuleCategoryKey(previousQuestion) !== form.currentCategory) {
      openInterstitial(getRuleCategoryKey(previousQuestion), false, 'previous')
      return
    }

    form.goToPreviousQuestion()
  }

  const handleCompleteButton = async () => {
    if (form.currentCategory) {
      openInterstitial(form.currentCategory, true, 'next')
      return
    }

    await completeSurvey()
  }

  const completeSurvey = async () => {
    if (isCompleting) {
      return
    }

    setIsCompleting(true)

    try {
      await createSurveyResponse(surveyId, JSON.stringify(simulation satisfies MipSimulationState))
      router.replace(`/${surveyId}/results`)
    } catch (error) {
      console.error('Survey completion failed', { surveyId, error })
    } finally {
      setIsCompleting(false)
    }
  }

  const groupedElements = buildGroupedElements(engine, form.currentQuestion, meta.mosaicChildrenWithParent)
  const currentTitle = getCurrentSectionTitle(engine, groupedElements)
  const categoryKey = getCategoryKey(groupedElements)
  const currentIndex = form.currentQuestion ? form.relevantQuestions.indexOf(form.currentQuestion) : -1
  const isLastQuestion = form.currentQuestion === null || currentIndex === form.relevantQuestions.length - 1
  const hasPreviousPage = currentIndex > 0
  const setValue = (ruleName: string, value: string | number | boolean | undefined) => rule.setValue(value, ruleName)
  const closeInterstitial = () => {
    setInterstitialCategoryKey(null)
    setIsFinalInterstitial(false)
  }
  const goBackFromInterstitial = () => {
    closeInterstitial()
    if (interstitialDirection === 'previous') {
      form.goToPreviousQuestion()
    }
  }
  const continueFromInterstitial = () => {
    closeInterstitial()
    if (interstitialDirection === 'next') {
      form.goToNextQuestion()
    }
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
                  onPrevious={goBackFromInterstitial}
                  onNext={continueFromInterstitial}
                  onComplete={completeSurvey}
                />
              </>
            ) : (
              <>
                <SurveyProgressHeader
                  title={currentTitle.label}
                  icons={currentTitle.icons}
                  progress={form.progression}
                  categoryKey={categoryKey}
                  questionLabel={t('progress.question', {
                    current: Math.max(currentIndex + 1, 1),
                    total: Math.max(form.relevantQuestions.length, 1),
                  })}
                  completionLabel={t('progress.complete', { percent: form.progression })}
                />

                <SurveyQuestionList groupedElements={groupedElements} engine={engine} setValue={setValue} />
                <SurveyNavigation
                  hasPreviousPage={hasPreviousPage}
                  canGoBackToExplanation={!hasPreviousPage}
                  isLastPage={isLastQuestion}
                  isCompleting={isCompleting}
                  backToExplanationLabel={t('navigation.backToExplanation')}
                  previousLabel={tCommon('previous')}
                  nextLabel={tCommon('next')}
                  completeLabel={t('navigation.complete')}
                  onBackToExplanation={() => setIsExplanationVisible(true)}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onComplete={handleCompleteButton}
                />
              </>
            )}
          </div>
          <SurveyCategoriesSidebar
            activeCategoryKey={interstitialCategoryKey ?? categoryKey}
            situation={simulation.situation}
            relevantQuestions={form.relevantQuestions}
          />
        </div>
      </Container>
    </div>
  )
}

export default Survey
