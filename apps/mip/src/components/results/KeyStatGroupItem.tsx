'use client'

import { KeyStatGroup, KeyStatUnit } from '@/types/results.types'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './KeyStatGroupItem.module.css'

interface Props {
  group: KeyStatGroup
}

const KeyStatGroupItem = ({ group }: Props) => {
  const t = useTranslations('results')

  const formatStatNumber = (value: number) => {
    const hasDecimals = !Number.isInteger(value)
    return formatNumber(value, hasDecimals ? 1 : 0)
  }

  const formatStatValue = (value: number, unit: KeyStatUnit) => {
    if (unit === 'number') {
      return formatStatNumber(value)
    }

    if (unit === 'percent') {
      return `${formatStatNumber(value)}${t('keyStats.units.percent')}`
    }

    return `${formatStatNumber(value)} ${t(`keyStats.units.${unit}`, { count: value })}`
  }

  return (
    <div className="mb2">
      <Typography variant="h6" className="mb1">
        {t(`keyStats.${group.key}.title`)}
      </Typography>
      <div className="flex-col gapped-2">
        {group.stats.map((stat) => (
          <div key={stat.key} className={`flex justify-between align-start gapped1 py025 ${styles.statRow}`}>
            <Typography variant="body2" className={styles.statLabel}>
              {t(`keyStats.${group.key}.${stat.key}`)}
            </Typography>
            <Typography variant="body2" className={`bold ${styles.statValue}`}>
              {formatStatValue(stat.value, stat.unit)}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyStatGroupItem
