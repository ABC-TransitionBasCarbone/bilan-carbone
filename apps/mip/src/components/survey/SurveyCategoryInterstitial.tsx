'use client'

import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import styles from './SurveyCategoryInterstitial.module.css'

const CATEGORY_TO_IMPACTCO2_TYPE: Record<string, string> = {
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
  const mountRef = useRef<HTMLDivElement | null>(null)
  const type = CATEGORY_TO_IMPACTCO2_TYPE[categoryKey]

  useEffect(() => {
    if (!mountRef.current || !type) {
      return
    }

    mountRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://impactco2.fr/iframe.js'
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = type
    script.dataset.search = '?language=fr&theme=default'

    mountRef.current.appendChild(script)

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [type])

  return (
    <div className={`${styles.interstitial} flex-col`} data-testid="survey-category-interstitial">
      <Typography variant="body1" className="mb1">
        {t('interstitial.title')}
      </Typography>
      <div className={styles.widgetCard}>
        <div ref={mountRef} />
      </div>
    </div>
  )
}

export default SurveyCategoryInterstitial
