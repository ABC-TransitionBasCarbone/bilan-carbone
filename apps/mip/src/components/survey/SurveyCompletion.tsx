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

const CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'divers', 'logement']

interface Props {
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

const getPositiveNodeValue = (nodeValue: unknown) => (typeof nodeValue === 'number' ? Math.max(0, nodeValue) : 0)

const SurveyCompletion = ({ surveyId, model, restoreFromStorage = false }: Props) => {
  const t = useTranslations('survey.completion')
  const { engine } = useMipPublicodes()
  const router = useRouter()

  useEffect(() => {
    if (!restoreFromStorage) {
      return
    }
    const savedSituation = loadSurveyState<StoredSurveyState>(surveyId)?.situation
    if (isSituation(savedSituation)) {
      engine.setSituation(savedSituation)
    }
  }, [engine, restoreFromStorage, surveyId])

  const totalEval = engine.evaluate('bilan')
  const totalKg = getPositiveNodeValue(totalEval.nodeValue)

  const categories = useMemo<CategoryResult[]>(() => {
    return CATEGORY_KEYS.map((key) => {
      const result = engine.evaluate(key)
      const rule = model?.[key] as ModelRule | undefined
      return {
        key,
        titre: rule?.titre ?? key,
        icones: rule?.icônes ?? '',
        valueKg: getPositiveNodeValue(result.nodeValue),
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
          const savingsKg = getPositiveNodeValue(result.nodeValue)
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

  const actionsByCategoryMap = useMemo(() => {
    return actions.reduce<Record<string, ActionResult[]>>((acc, action) => {
      if (!acc[action.categoryKey]) {
        acc[action.categoryKey] = []
      }
      acc[action.categoryKey].push(action)
      return acc
    }, {})
  }, [actions])

  const topCategories = categories.slice(0, 3)
  const keyActionCategories = topCategories
    .map((category) => ({
      ...category,
      actions: (actionsByCategoryMap[category.key] ?? []).slice(0, 4),
    }))
    .filter((category) => category.actions.length > 0)

  const actionsByCategory = categories.map((category) => ({
    ...category,
    actions: actionsByCategoryMap[category.key] ?? [],
  }))

  const handleRestart = () => {
    clearSurveyState(surveyId)
    router.replace(`/${surveyId}/survey`)
  }

  return (
    <div className={styles.scrollWrapper}>
      <Container maxWidth="md" className={`${styles.page} pt2`}>
        <FootprintBanner totalKg={totalKg} />
        <TransitionEncart totalKg={totalKg} />
        <ActionsTabsSection keyActionCategories={keyActionCategories} totalKg={totalKg} />
        <SummarySection actionsByCategory={actionsByCategory} totalKg={totalKg} />
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
