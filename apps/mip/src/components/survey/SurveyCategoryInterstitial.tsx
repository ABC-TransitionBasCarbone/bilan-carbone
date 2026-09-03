'use client'

import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { getImpactCo2WidgetSearch, getImpactCo2WidgetType } from './impactCo2'
import ImpactCo2Widget from './ImpactCo2Widget'
import styles from './SurveyCategoryInterstitial.module.css'

interface Props {
  categoryKey: string
}

const SurveyCategoryInterstitial = ({ categoryKey }: Props) => {
  const t = useTranslations('survey')
  const type = getImpactCo2WidgetType(categoryKey, 'interstitial')
  const search = getImpactCo2WidgetSearch(categoryKey, 'interstitial')

  return (
    <div className="flex-col gapped1" data-testid="survey-category-interstitial">
      <Typography variant="body1" className="mb1">
        {t('interstitial.title')}
      </Typography>
      <ImpactCo2Widget type={type} search={search} className={styles.widgetCard} />
    </div>
  )
}

export default SurveyCategoryInterstitial
