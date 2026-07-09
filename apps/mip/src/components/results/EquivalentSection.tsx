'use client'

import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef } from 'react'
import styles from './EquivalentSection.module.css'

interface Props {
  averageFootprintKg: number
}

const COMPARISONS = 'game-of-thrones,alimentationordinateur,repasavecdulieunoir'

const EquivalentSection = ({ averageFootprintKg }: Props) => {
  const t = useTranslations('results.equivalent')
  const mountRef = useRef<HTMLDivElement | null>(null)

  const scriptSearch = useMemo(
    () => `?value=${Math.max(1, Math.round(averageFootprintKg))}&comparisons=${COMPARISONS}&language=fr&theme=default`,
    [averageFootprintKg],
  )

  useEffect(() => {
    if (!mountRef.current) {
      return
    }

    mountRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://impactco2.fr/iframe.js'
    script.async = true
    script.dataset.name = 'impact-co2'
    script.dataset.type = 'comparateur'
    script.dataset.search = scriptSearch

    mountRef.current.appendChild(script)

    return () => {
      if (mountRef.current) {
        mountRef.current.innerHTML = ''
      }
    }
  }, [scriptSearch])

  return (
    <section className="mt1">
      <Typography variant="h6" className="mb-2">
        {t('title')}
      </Typography>
      <Typography className={`${styles.description} mb1`}>{t('description')}</Typography>
      <div className={`${styles.comparatorCard} p1`}>
        <div className="w100" ref={mountRef} />
      </div>
    </section>
  )
}

export default EquivalentSection
