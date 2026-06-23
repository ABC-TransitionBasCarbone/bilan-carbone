'use client'

import { KeyStatGroup } from '@/data/sampleResults'
import { Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import KeyStatGroupItem from './KeyStatGroupItem'
import styles from './KeyStatsSection.module.css'

interface Props {
  keyStats: KeyStatGroup[]
}

const KeyStatsSection = ({ keyStats }: Props) => {
  const t = useTranslations('results')

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('keyStats.title')}
      </Typography>
      <Card>
        <CardContent className="p15">
          <div className={styles.keyStatsGrid}>
            {keyStats.map((group) => (
              <KeyStatGroupItem key={group.key} group={group} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default KeyStatsSection
