'use client'

import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import {
  formatMassKilograms,
  getCategoryToneSuffix,
  getPositiveNodeValue,
  SURVEY_CATEGORY_KEYS,
} from '@abc-transitionbascarbone/publicodes/form'
import classNames from 'classnames'
import styles from './SurveyCategoriesSidebar.module.css'

interface Props {
  activeCategoryKey: string | null
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

const SurveyCategoriesSidebar = ({ activeCategoryKey }: Props) => {
  const { engine } = useMipPublicodes()
  const rules = engine.getParsedRules()

  const categories: CategoryItem[] = SURVEY_CATEGORY_KEYS.map((key) => {
    const raw = rules[key]?.rawNode as { titre?: string; icônes?: string } | undefined
    const result = engine.evaluate(key)
    const valueKg = getPositiveNodeValue(result.nodeValue)
    const isActive = key === activeCategoryKey
    const toneSuffix = getCategoryToneSuffix(key)

    return {
      key,
      titre: raw?.titre ?? key,
      icones: raw?.icônes ?? '',
      valueKg,
      isActive,
      isAnswered: valueKg > 0,
      toneClassName: styles[`category${toneSuffix}`] ?? styles.categoryDt,
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
