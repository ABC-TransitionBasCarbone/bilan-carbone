'use client'

import ImpactCo2Widget from './ImpactCo2Widget'
import styles from './SurveyImpactCo2Section.module.css'

// Maps MIP category keys to impactco2 widget types.
// Only categories with a relevant impactco2 widget are listed.
const SECTION_WIDGET_BY_CATEGORY: Record<string, string> = {
  DT: 'transport',
  transport: 'transport',
  alimentation: 'alimentation',
  logement: 'chauffage',
}

interface Props {
  categoryKey: string
}

const SurveyImpactCo2Section = ({ categoryKey }: Props) => {
  const type = SECTION_WIDGET_BY_CATEGORY[categoryKey]

  if (!type) {
    return null
  }

  return <ImpactCo2Widget type={type} className={styles.widgetCard} testId="survey-impactco2-widget" />
}

export default SurveyImpactCo2Section
