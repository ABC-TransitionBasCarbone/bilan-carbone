'use client'

import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'
import styles from './SurveyCategoryInterstitial.module.css'

const SurveyCategoryInterstitial = () => {
  const t = useTranslations('survey')
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!mountRef.current) {
      return
    }

    mountRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://impactco2.fr/iframe.js'
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = 'quiz'
    script.dataset.search = '?language=fr&theme=default'

    mountRef.current.appendChild(script)

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [])

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
