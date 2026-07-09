'use client'

import ActionsTabsSection from '@/components/survey/completion/ActionsTabsSection'
import FaqSection from '@/components/survey/completion/FaqSection'
import FootprintBanner from '@/components/survey/completion/FootprintBanner'
import SummarySection from '@/components/survey/completion/SummarySection'
import TopCategoriesSection from '@/components/survey/completion/TopCategoriesSection'
import TransitionEncart from '@/components/survey/completion/TransitionEncart'
import { ActionResult, CategoryResult } from '@/components/survey/completion/types'
import { clearSurveyState, loadSurveyState } from '@/components/survey/surveyStateStorage'
import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import type { RawRules } from '@/publicodes/mip-engine'
import { Refresh } from '@mui/icons-material'
import { Button, Container } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Situation } from 'publicodes'
import { useEffect, useMemo } from 'react'
import styles from './SurveyCompletion.module.css'

type ModelRule = {
  titre?: string
  icônes?: string
  somme?: Array<string | number>
}

const CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'divers', 'logement'] as const

const CATEGORY_TONE_CLASSES = [styles.toneA, styles.toneB, styles.toneC, styles.toneD, styles.toneE]

interface Props {
  onRestart?: () => void
  surveyId: string
  model: RawRules
  restoreFromStorage?: boolean
}

type StoredSurveyState = {
  situation?: Situation<string>
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isSituation = (value: unknown): value is Situation<string> => {
  if (!isRecord(value)) {
    return false
  }
  return Object.values(value).every(
    (entry) => entry === null || typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean',
  )
}

const hasStoredSituation = (value: StoredSurveyState | null): value is { situation: Situation<string> } => {
  return Boolean(value && isSituation(value.situation))
}

const SurveyCompletion = ({ onRestart, surveyId, model, restoreFromStorage = false }: Props) => {
  const t = useTranslations('survey.completion')
  const { engine } = useMipPublicodes()
  const router = useRouter()

  useEffect(() => {
    if (!restoreFromStorage) {
      return
    }
    const savedState = loadSurveyState<StoredSurveyState>(surveyId)
    if (hasStoredSituation(savedState)) {
      engine.setSituation(savedState.situation)
    }
  }, [engine, restoreFromStorage, surveyId])

  const totalEval = engine.evaluate('bilan')
  const totalKg = typeof totalEval.nodeValue === 'number' ? Math.max(0, totalEval.nodeValue) : 0

  const categories = useMemo<CategoryResult[]>(() => {
    return CATEGORY_KEYS.map((key) => {
      const result = engine.evaluate(key)
      const valueKg = typeof result.nodeValue === 'number' ? Math.max(0, result.nodeValue) : 0
      const rule = model?.[key] as ModelRule | undefined
      return {
        key,
        titre: rule?.titre ?? key,
        icones: rule?.icônes ?? '',
        valueKg,
      }
    }).sort((a, b) => b.valueKg - a.valueKg)
  }, [engine, model])

  const actions = useMemo<ActionResult[]>(() => {
    const actionsRule = model?.['actions'] as { somme?: Array<string | number> } | null | undefined
    const actionKeys = (actionsRule?.somme ?? []).filter((value): value is string => typeof value === 'string')

    return actionKeys
      .flatMap((key) => {
        try {
          const result = engine.evaluate(key)
          const savingsKg = typeof result.nodeValue === 'number' ? Math.max(0, result.nodeValue) : 0
          const rule = model?.[key] as ModelRule | undefined
          return [
            {
              key,
              titre: rule?.titre ?? key,
              icones: rule?.icônes ?? '',
              categoryKey: key.split(' . ')[0],
              savingsKg,
            },
          ]
        } catch {
          return []
        }
      })
      .filter((action) => action.savingsKg > 0)
      .sort((a, b) => b.savingsKg - a.savingsKg)
  }, [engine, model])

  const topCategories = categories.slice(0, 3)
  const keyActionCategories = topCategories
    .map((category) => ({
      ...category,
      actions: actions.filter((action) => action.categoryKey === category.key).slice(0, 4),
    }))
    .filter((category) => category.actions.length > 0)

  const actionsByCategory = categories.map((category) => ({
    ...category,
    actions: actions.filter((action) => action.categoryKey === category.key),
  }))

  const handleRestart = () => {
    clearSurveyState(surveyId)
    if (onRestart) {
      onRestart()
      return
    }
    router.push(`/survey/${surveyId}`)
  }

  return (
    <div className={styles.scrollWrapper}>
      <Container maxWidth="md" className={`${styles.page} pt2`}>
        <FootprintBanner totalKg={totalKg} />
        <TransitionEncart totalKg={totalKg} />
        <ActionsTabsSection keyActionCategories={keyActionCategories} totalKg={totalKg} />
        <SummarySection
          actionsByCategory={actionsByCategory}
          totalKg={totalKg}
          categoryToneClasses={CATEGORY_TONE_CLASSES}
        />
        <TopCategoriesSection topCategories={topCategories} />

        <FaqSection />

        <div className="justify-center wrap gapped075 mt1">
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRestart}>
            {t('restart')}
          </Button>
        </div>
      </Container>
    </div>
  )
}

export default SurveyCompletion
