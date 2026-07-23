'use client'

import { useMipPublicodes } from '@/publicodes/MipPublicodesProvider'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import classNames from 'classnames'
import styles from './SurveyCategoriesSidebar.module.css'

export const SURVEY_CATEGORY_KEYS = ['DT', 'transport', 'alimentation', 'divers', 'logement']

const getPositiveNodeValue = (nodeValue: unknown) => (typeof nodeValue === 'number' ? Math.max(0, nodeValue) : 0)

const formatCategoryValue = (kg: number): string => {
  if (kg >= 1000) {
    return `${formatNumber(kg / 1000, 1)} t`
  }
  return `${formatNumber(Math.round(kg))} kg`
}

interface Props {
  activeCategoryKey: string | null
}

const SurveyCategoriesSidebar = ({ activeCategoryKey }: Props) => {
  const { engine } = useMipPublicodes()
  const rules = engine.getParsedRules()

  const categories = SURVEY_CATEGORY_KEYS.map((key) => {
    const raw = rules[key]?.rawNode as { titre?: string; icônes?: string } | undefined
    const result = engine.evaluate(key)
    const valueKg = getPositiveNodeValue(result.nodeValue)
    return {
      key,
      titre: raw?.titre ?? key,
      icones: raw?.icônes ?? '',
      valueKg,
    }
  })

  return (
    <aside className={styles.sidebar} data-testid="survey-categories-sidebar">
      {categories.map((cat) => {
        const isActive = cat.key === activeCategoryKey
        return (
          <div
            key={cat.key}
            className={classNames(styles.categoryItem, 'justify-between', 'align-center', {
              [styles.active]: isActive,
            })}
          >
            <div className={classNames(styles.categoryLabel, 'align-center')}>
              <span>{cat.icones}</span>
              <span className={styles.title}>{cat.titre}</span>
            </div>
            {cat.valueKg > 0 && (
              <span className={classNames(styles.value, { [styles.activeValue]: isActive })}>
                {formatCategoryValue(cat.valueKg)}
              </span>
            )}
          </div>
        )
      })}
    </aside>
  )
}

export default SurveyCategoriesSidebar
