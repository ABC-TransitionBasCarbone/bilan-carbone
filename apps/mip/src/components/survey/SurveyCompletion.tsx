'use client'

import ActionsTabsSection from '@/components/survey/completion/ActionsTabsSection'
import FaqSection from '@/components/survey/completion/FaqSection'
import FootprintBanner from '@/components/survey/completion/FootprintBanner'
import SummarySection from '@/components/survey/completion/SummarySection'
import TopCategoriesSection from '@/components/survey/completion/TopCategoriesSection'
import TransitionEncart from '@/components/survey/completion/TransitionEncart'
import { ActionResult, CategoryResult } from '@/components/survey/completion/types'
import { clearSurveyState, loadSurveyState } from '@/components/survey/surveyStateStorage'
import { useMipPublicodes } from '@/lib/publicodes/MipPublicodesProvider'
import {
  createMipEngineWithoutDefaults,
  getSurveyCategoryKeysFromRawRules,
  type RawRules,
} from '@/lib/publicodes/mip-engine'
import { normalizeSituation, type MipSimulationState } from '@/utils/survey'
import { getRuleCategoryKey } from '@abc-transitionbascarbone/shared/publicodes/form'
import { safeEvaluate } from '@abc-transitionbascarbone/shared/publicodes/utils'
import { getPositiveNodeValue } from '@abc-transitionbascarbone/shared/utils/number'
import { Refresh } from '@mui/icons-material'
import { Button, Container } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import styles from './SurveyCompletion.module.css'

type ModelRule = {
  titre?: string
  icônes?: string
  somme?: Array<string | number>
}

interface Props {
  model: RawRules
  restoreFromStorage?: boolean
}

const SurveyCompletion = ({ model, restoreFromStorage = false }: Props) => {
  const t = useTranslations('survey.completion')
  const { surveyId, simulation, updateSimulation } = useMipPublicodes()
  const { situation } = simulation
  const router = useRouter()

  useEffect(() => {
    if (!restoreFromStorage) {
      return
    }
    const savedSituation = normalizeSituation(loadSurveyState<MipSimulationState>(surveyId)?.situation)
    if (savedSituation) {
      updateSimulation({ situation: savedSituation })
      return
    }
  }, [restoreFromStorage, updateSimulation, surveyId])

  const resultEngine = useMemo(() => createMipEngineWithoutDefaults(model).setSituation(situation), [model, situation])
  const totalKgFromBilan = getPositiveNodeValue(safeEvaluate(resultEngine, 'bilan'))
  const categoryKeys = useMemo(() => getSurveyCategoryKeysFromRawRules(model), [model])

  const categories = useMemo<CategoryResult[]>(() => {
    return categoryKeys
      .map((key) => {
        const rule = model?.[key] as ModelRule | undefined
        let valueKg = 0
        try {
          valueKg = getPositiveNodeValue(resultEngine.evaluate(key).nodeValue)
        } catch {}
        return {
          key,
          titre: rule?.titre ?? key,
          icones: rule?.icônes ?? '',
          valueKg,
        }
      })
      .sort((a, b) => b.valueKg - a.valueKg)
  }, [categoryKeys, model, resultEngine])

  const totalKgFromCategories = categories.reduce((sum, category) => sum + category.valueKg, 0)
  const totalKg = totalKgFromBilan > 0 ? totalKgFromBilan : totalKgFromCategories

  const actions = useMemo<ActionResult[]>(() => {
    const actionsRule = model?.['actions'] as { somme?: Array<string | number> } | null | undefined
    const actionKeys = (actionsRule?.somme ?? []).filter((value): value is string => typeof value === 'string')

    return actionKeys
      .flatMap((key) => {
        try {
          const result = resultEngine.evaluate(key)
          const savingsKg = getPositiveNodeValue(result.nodeValue)
          const rule = model?.[key] as ModelRule | undefined
          return [
            {
              key,
              titre: rule?.titre ?? key,
              icones: rule?.icônes ?? '',
              categoryKey: getRuleCategoryKey(key),
              savingsKg,
            },
          ]
        } catch {
          return []
        }
      })
      .filter((action) => action.savingsKg > 0)
      .sort((a, b) => b.savingsKg - a.savingsKg)
  }, [model, resultEngine])

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
