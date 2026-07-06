'use client'

import { KeyStatGroup } from '@/data/sampleResults'
import { formatNumber } from '@abc-transitionbascarbone/utils/number'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './KeyStatGroupItem.module.css'

interface Props {
  group: KeyStatGroup
}

const formatStatValue = (value: number, unit: 'percent' | 'number' | 'km' | 'hours' | 'nights') => {
  if (unit === 'percent') {
    return `${formatNumber(value, 0)} %`
  }

  if (unit === 'km') {
    return `${formatNumber(value, 0)} km`
  }

  if (unit === 'hours') {
    return `${formatNumber(value, 1)} h`
  }

  if (unit === 'nights') {
    return `${formatNumber(value, 1)} nuit${value > 1 ? 's' : ''}`
  }

  return formatNumber(value, value % 1 === 0 ? 0 : 1)
}

const KeyStatGroupItem = ({ group }: Props) => {
  const t = useTranslations('results')

  return (
    <div className="mb2">
      <Typography variant="h6" className="mb1">
        {t(`keyStats.${group.key}.title`)}
      </Typography>
      <div className="flex-col gapped-2">
        {group.stats.map((stat) => (
          <div key={stat.key} className={`flex justify-between ${styles.statRow}`}>
            <Typography variant="body2">{t(`keyStats.${group.key}.${stat.key}`)}</Typography>
            <Typography variant="body2" className="bold">
              {formatStatValue(stat.value, stat.unit)}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyStatGroupItem
