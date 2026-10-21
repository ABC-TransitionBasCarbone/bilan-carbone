'use client'

import { useMipPublicodes } from '@/lib/publicodes/MipPublicodesProvider'
import { getSurveyCategoryKeysFromParsedRules } from '@/lib/publicodes/mip-engine'
import { hasRuleAnswer } from '@/lib/publicodes/mip-rules'
import {
  formatMassKilograms,
  getCategoryClassSuffix,
  getRuleCategoryKey,
} from '@abc-transitionbascarbone/common/publicodes/form/utils'
import { getPositiveNodeValue } from '@abc-transitionbascarbone/common/utils/number'
import classNames from 'classnames'
import { Situation } from 'publicodes'
import { useMemo } from 'react'
import styles from './SurveyCategoriesSidebar.module.css'

interface Props {
  activeCategoryKey: string | null
  situation: Situation<string>
  relevantQuestions: string[]
}

interface CategoryItem {
  key: string
  titre: string
  icones: string
  valueKg: number
  isActive: boolean
  toneClassName: string
  completedQuestions: number
  totalQuestions: number
}

interface SidebarItemProps {
  item: CategoryItem
}

const SidebarItem = ({ item }: SidebarItemProps) => {
  const valueLabel = item.completedQuestions > 0 ? formatMassKilograms(item.valueKg) : ''

  return (
    <div
      className={classNames(styles.categoryItem, item.toneClassName, 'justify-between', 'align-center', 'gapped-2', {
        [styles.active]: item.isActive,
      })}
    >
      <progress
        className={styles.progress}
        value={item.completedQuestions}
        max={item.totalQuestions || 1}
        aria-label={item.titre}
      />
      <div className={classNames(styles.categoryLabel, 'align-center', 'gapped-2')}>
        <span>{item.icones}</span>
        <span className={styles.title}>{item.titre}</span>
      </div>
      <span className={classNames(styles.value, { [styles.activeValue]: item.isActive })}>{valueLabel}</span>
    </div>
  )
}

const SurveyCategoriesSidebar = ({ activeCategoryKey, situation, relevantQuestions }: Props) => {
  const { engine, meta } = useMipPublicodes()
  const previewEngine = useMemo(() => {
    const localEngine = engine.shallowCopy()
    localEngine.setSituation({ ...situation })
    return localEngine
  }, [engine, situation])

  const rules = previewEngine.getParsedRules()
  const categoryKeys = getSurveyCategoryKeysFromParsedRules(rules)

  const categories: CategoryItem[] = categoryKeys.map((key) => {
    const raw = rules[key]?.rawNode as { titre?: string; icônes?: string } | undefined
    const categoryQuestions = relevantQuestions.filter((name) => getRuleCategoryKey(name) === key)
    const completedQuestions = categoryQuestions.filter((question) =>
      hasRuleAnswer(question, situation, meta.mosaicChildrenWithParent),
    ).length
    const result = (() => {
      try {
        return previewEngine.evaluate(key)
      } catch {
        return { nodeValue: 0 }
      }
    })()
    const valueKg = getPositiveNodeValue(result.nodeValue)
    const isActive = key === activeCategoryKey
    const categoryClassSuffix = getCategoryClassSuffix(key)

    return {
      key,
      titre: raw?.titre ?? key,
      icones: raw?.icônes ?? '',
      valueKg,
      isActive,
      toneClassName: styles[`category${categoryClassSuffix}`] ?? styles.categoryDt,
      completedQuestions,
      totalQuestions: categoryQuestions.length,
    }
  })

  return (
    <aside className={classNames(styles.sidebar, 'flex-col', 'gapped-2')} data-testid="survey-categories-sidebar">
      {categories.map((category) => (
        <SidebarItem key={category.key} item={category} />
      ))}
    </aside>
  )
}

export default SurveyCategoriesSidebar
