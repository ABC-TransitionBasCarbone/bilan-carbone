'use client'

import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import ImpactCo2Widget from '../survey/ImpactCo2Widget'
import styles from './EquivalentSection.module.css'

interface Props {
  averageFootprintKg: number
}

// Comparison identifiers are defined by the external Impact CO2 widget API.
const IMPACT_CO2_COMPARISON_IDS = ['game-of-thrones', 'alimentationordinateur', 'repasavecdulieunoir']

const EquivalentSection = ({ averageFootprintKg }: Props) => {
  const t = useTranslations('results.equivalent')

  const scriptSearch = useMemo(
    () =>
      `?value=${Math.max(1, Math.round(averageFootprintKg))}&comparisons=${IMPACT_CO2_COMPARISON_IDS.join(',')}&language=fr&theme=default`,
    [averageFootprintKg],
  )

  return (
    <section className="mt1">
      <Typography variant="h6" className="mb-2">
        {t('title')}
      </Typography>
      <Typography color="text.secondary" className="mb1">
        {t('description')}
      </Typography>
      <div className={classNames(styles.comparatorCard, 'p1')}>
        <ImpactCo2Widget type="comparateur" search={scriptSearch} className="w100" />
      </div>
    </section>
  )
}

export default EquivalentSection
