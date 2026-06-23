'use client'

import { KeyStatGroup } from '@/data/sampleResults'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './KeyStatGroupItem.module.css'

interface Props {
  group: KeyStatGroup
  statQuestions?: Record<string, string>
}

const KeyStatGroupItem = ({ group, statQuestions }: Props) => {
  const t = useTranslations('results')

  return (
    <div className="mb2">
      <Typography variant="h6" className="mb1">
        {t(`keyStats.${group.key}.title`)}
      </Typography>
      <div className="flex-col gapped-2">
        {group.stats.map((stat) => (
          <div key={stat.key} className={`flex justify-between ${styles.statRow}`}>
            <Typography variant="body2">
              {statQuestions?.[stat.key] ?? t(`keyStats.${group.key}.${stat.key}`)}
            </Typography>
            <Typography variant="body2" className="bold">
              {stat.unit === 'percent' ? `${stat.value} %` : stat.value}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyStatGroupItem
