'use client'

import { getImpactCo2WidgetSearch, getImpactCo2WidgetType } from './impactCo2'
import ImpactCo2Widget from './ImpactCo2Widget'
import styles from './SurveyImpactCo2Section.module.css'

interface Props {
  categoryKey: string
}

const SurveyImpactCo2Section = ({ categoryKey }: Props) => {
  const type = getImpactCo2WidgetType(categoryKey, 'section')
  const search = getImpactCo2WidgetSearch(categoryKey, 'section')

  if (!type) {
    return null
  }

  return <ImpactCo2Widget type={type} search={search} className={styles.widgetCard} testId="survey-impactco2-widget" />
}

export default SurveyImpactCo2Section
