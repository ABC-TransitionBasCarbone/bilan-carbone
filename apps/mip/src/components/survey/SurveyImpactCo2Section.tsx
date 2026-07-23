'use client'

import { useEffect, useRef } from 'react'
import styles from './SurveyImpactCo2Section.module.css'

// Maps MIP category keys to impactco2 widget types.
// Only categories with a relevant impactco2 widget are listed.
const CATEGORY_TO_IMPACTCO2_TYPE: Record<string, string> = {
  DT: 'transport',
  transport: 'transport',
  alimentation: 'alimentation',
  logement: 'chauffage',
}

interface Props {
  categoryKey: string
}

const SurveyImpactCo2Section = ({ categoryKey }: Props) => {
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

  if (!type) {
    return null
  }

  return (
    <div className={styles.widgetCard} data-testid="survey-impactco2-widget">
      <div ref={mountRef} />
    </div>
  )
}

export default SurveyImpactCo2Section
