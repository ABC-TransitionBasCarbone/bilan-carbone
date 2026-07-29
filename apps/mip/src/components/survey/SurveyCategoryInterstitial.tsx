'use client'

import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import ImpactCo2Widget from './ImpactCo2Widget'
import styles from './SurveyCategoryInterstitial.module.css'

const INTERSTITIAL_WIDGET_BY_CATEGORY: Record<string, string> = {
  DT: 'transport',
  transport: 'transport',
  alimentation: 'alimentation',
  divers: 'numerique',
  logement: 'quiz',
}

interface Props {
  categoryKey: string
}

const SurveyCategoryInterstitial = ({ categoryKey }: Props) => {
  const t = useTranslations('survey')
  const type = INTERSTITIAL_WIDGET_BY_CATEGORY[categoryKey]

  return (
    <div className="flex-col gapped1" data-testid="survey-category-interstitial">
      <Typography variant="body1" className="mb1">
        {t('interstitial.title')}
      </Typography>
      <ImpactCo2Widget type={type} className={styles.widgetCard} />
    </div>
  )
}

export default SurveyCategoryInterstitial
