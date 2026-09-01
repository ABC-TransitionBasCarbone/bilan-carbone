'use client'

import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { getSurveyCategoryKeysFromParsedRules } from '@/publicodes/mip-engine'
import { formatMassKilograms, getCategoryClassSuffix } from '@abc-transitionbascarbone/publicodes/form'
import { getPositiveNodeValue } from '@abc-transitionbascarbone/utils/number'
import classNames from 'classnames'
import { Situation } from 'publicodes'
import styles from './SurveyCategoriesSidebar.module.css'

interface Props {
  activeCategoryKey: string | null
  situation: Situation<string>
}

interface CategoryItem {
  key: string
  titre: string
  icones: string
  valueKg: number
  isActive: boolean
  isAnswered: boolean
  toneClassName: string
}

interface SidebarItemProps {
  item: CategoryItem
}

const SidebarItem = ({ item }: SidebarItemProps) => {
  return (
    <div
      className={classNames(styles.categoryItem, 'justify-between', 'align-center', 'gapped-2', {
        [item.toneClassName]: item.isAnswered,
        [styles.active]: item.isActive,
      })}
    >
      <div className={classNames(styles.categoryLabel, 'align-center', 'gapped-2')}>
        <span>{item.icones}</span>
        <span className={styles.title}>{item.titre}</span>
      </div>
      <span className={classNames(styles.value, { [styles.activeValue]: item.isActive })}>
        {formatMassKilograms(item.valueKg)}
      </span>
    </div>
  )
}

const SurveyCategoriesSidebar = ({ activeCategoryKey, situation }: Props) => {
  const { engine } = useMipPublicodes()
  const previewEngine = engine.shallowCopy()
  previewEngine.setSituation({ ...situation })

  const rules = previewEngine.getParsedRules()
  const categoryKeys = getSurveyCategoryKeysFromParsedRules(rules)

  const categories: CategoryItem[] = categoryKeys.map((key) => {
    const raw = rules[key]?.rawNode as { titre?: string; icônes?: string } | undefined
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
      isAnswered: valueKg > 0,
      toneClassName: styles[`category${categoryClassSuffix}`] ?? styles.categoryDt,
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
