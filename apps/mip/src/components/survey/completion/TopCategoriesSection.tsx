'use client'

import { CategoryResult } from '@/components/survey/completion/types'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from '../SurveyCompletion.module.css'

interface Props {
  topCategories: CategoryResult[]
}

const TopCategoriesSection = ({ topCategories }: Props) => {
  const t = useTranslations('survey.completion')

  return (
    <section className="mb2" data-testid="survey-completion-top-categories">
      <Typography variant="h6" className={styles.sectionTitle}>
        {t('topCategories.title')}
      </Typography>

      <div className="flex-col gapped075">
        {topCategories.map((category, index) => (
          <div key={category.key} className={`${styles.topCategoryItem} align-center gapped1`}>
            <Typography className={styles.topCategoryRank}>{index + 1}</Typography>
            <Typography className={styles.topCategoryIcon}>{category.icones}</Typography>
            <Typography className={styles.topCategoryName}>{category.titre}</Typography>
            <Typography className={styles.topCategoryValue}>
              {formatNumber(Math.round(category.valueKg))} {t('kgUnit')}
            </Typography>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TopCategoriesSection
