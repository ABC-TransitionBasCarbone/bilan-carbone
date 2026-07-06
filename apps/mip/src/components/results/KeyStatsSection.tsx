'use client'

import { KeyStatGroup } from '@/data/sampleResults'
import { RawRules } from '@/publicodes/mip-engine'
import { Card, CardContent, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import KeyStatGroupItem from './KeyStatGroupItem'
import styles from './KeyStatsSection.module.css'

interface Props {
  keyStats: KeyStatGroup[]
  model: RawRules
  visibleStatsByGroup?: Partial<Record<string, string[]>>
}

const DEFAULT_VISIBLE_STATS_BY_GROUP: Partial<Record<string, string[]>> = {
  commute: [
    'carModeShare',
    'publicTransportModeShare',
    'activeModeShare',
    'avgCarKm',
    'avgPublicTransportKm',
    'avgEmissionPerMode',
  ],
  travel: [
    'trainModeShare',
    'carTravelModeShare',
    'planeTravelModeShare',
    'avgTravelKmByMode',
    'avgTravelEmissionByMode',
    'avgTravelNights',
  ],
  food: [
    'vegMealsShare',
    'veganMealsShare',
    'fullyVegetarianEmployees',
    'fullyVeganEmployees',
    'redMeatDailyEmployees',
  ],
  digital: ['aiRequestsPerDay', 'videoHoursPerDay', 'internetHoursPerDay'],
}

const KeyStatsSection = ({ keyStats, model, visibleStatsByGroup = DEFAULT_VISIBLE_STATS_BY_GROUP }: Props) => {
  const t = useTranslations('results')

  void model

  const filteredGroups = keyStats
    .map((group) => {
      const visibleStats = visibleStatsByGroup[group.key]
      if (!visibleStats || visibleStats.length === 0) {
        return group
      }

      const visibleSet = new Set(visibleStats)
      return {
        ...group,
        stats: group.stats.filter((stat) => visibleSet.has(stat.key)),
      }
    })
    .filter((group) => group.stats.length > 0)

  return (
    <section className="mb2">
      <Typography variant="h6" className="mb1">
        {t('keyStats.title')}
      </Typography>
      <Card>
        <CardContent className="p15">
          <div className={styles.keyStatsGrid}>
            {filteredGroups.map((group) => (
              <KeyStatGroupItem key={group.key} group={group} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default KeyStatsSection
